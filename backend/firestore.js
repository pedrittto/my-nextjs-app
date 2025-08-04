/**
 * Firestore helper functions for writing and updating documents
 */

const admin = require('firebase-admin');
const logger = require('./logger');

// Initialize Firebase Admin SDK
let db = null;

function initializeFirestore() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  
  db = admin.firestore();
  logger.info('Firestore initialized successfully');
}

/**
 * Write a new article document to Firestore
 * @param {Object} articleData - The article data to write
 * @returns {Promise<string>} - The document ID
 */
async function writeArticle(articleData) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const {
      title_pl,
      description_pl,
      title_en,
      description_en,
      credibility_score,
      published_at,
      image_url
    } = articleData;

    // Validate required fields
    if (!title_pl || !description_pl || !title_en || !description_en) {
      throw new Error('Missing required article fields');
    }

    const now = new Date().toISOString();
    let published = published_at || now;
    
    // Ensure published_at ends with 'Z' for ISO format
    if (!published.endsWith('Z')) {
      published = published + 'Z';
    }

    const documentData = {
      title_pl: title_pl,
      description_pl: description_pl,
      title_en: title_en,
      description_en: description_en,
      credibility_score: credibility_score || 0,
      published_at: published,
      created_at: now,
      image_url: image_url || ''
    };

    // Enhanced logging for Firestore save
    logger.info('Saving article to Firestore with image:', {
      title_en: title_en,
      image_url: image_url || '',
      has_image: !!image_url,
      document_fields: Object.keys(documentData)
    });

    const docRef = await db.collection('articles').add(documentData);
    logger.logFirestoreWrite(docRef.id);
    
    return docRef.id;
  } catch (error) {
    logger.logError('writeArticle', error);
    throw error;
  }
}

/**
 * Check if an article with similar content already exists
 * @param {Object} articleData - The article data to check
 * @returns {Promise<boolean>} - True if duplicate exists
 */
async function checkDuplicate(articleData) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const { title_en, description_en } = articleData;
    
    // Check for exact title match
    const titleQuery = await db.collection('articles')
      .where('title_en', '==', title_en)
      .limit(1)
      .get();

    if (!titleQuery.empty) {
      logger.info('Duplicate article found by title');
      return true;
    }

    // Check for similar description (first 100 chars)
    const descriptionStart = description_en.substring(0, 100);
    const descQuery = await db.collection('articles')
      .where('description_en', '>=', descriptionStart)
      .where('description_en', '<=', descriptionStart + '\uf8ff')
      .limit(1)
      .get();

    if (!descQuery.empty) {
      logger.info('Duplicate article found by description');
      return true;
    }

    return false;
  } catch (error) {
    logger.logError('checkDuplicate', error);
    // If we can't check for duplicates, assume it's not a duplicate
    return false;
  }
}

/**
 * Get recent articles to check for duplicates
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<Array>} - Array of recent articles
 */
async function getRecentArticles(hours = 24) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000)).toISOString();
    
    const snapshot = await db.collection('articles')
      .where('created_at', '>=', cutoffTime)
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const articles = [];
    snapshot.forEach(doc => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    logger.info(`Retrieved ${articles.length} recent articles`);
    return articles;
  } catch (error) {
    logger.logError('getRecentArticles', error);
    return [];
  }
}

module.exports = {
  initializeFirestore,
  writeArticle,
  checkDuplicate,
  getRecentArticles
}; 