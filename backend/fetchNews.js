/**
 * News fetching module
 * Currently supports NewsAPI, easily extensible for Twitter, RSS, etc.
 */

const axios = require('axios');
const logger = require('./logger');

// NewsAPI configuration
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Trusted news sources (from the original n8n workflow)
const TRUSTED_SOURCES = [
  'cnn',
  'bbc-news', 
  'al-jazeera-english',
  'the-washington-post',
  'fox-news',
  'msnbc',
  'reuters',
  'bloomberg'
];

/**
 * Fetch news articles from NewsAPI
 * @param {string} query - Search query
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Array of articles
 */
async function fetchFromNewsAPI(query, options = {}) {
  try {
    if (!NEWS_API_KEY) {
      throw new Error('NEWS_API_KEY is not configured');
    }

    const {
      pageSize = 100, // NewsAPI free tier limit
      sources = TRUSTED_SOURCES.join(','),
      sortBy = 'publishedAt',
      from = null,
      retries = 3,
      retryDelay = 5000
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const params = {
          q: query,
          pageSize,
          sources,
          sortBy,
          apiKey: NEWS_API_KEY
        };

        // Add date filter if provided
        if (from) {
          params.from = from;
        }

        logger.info(`Fetching news from NewsAPI with query: ${query} (attempt ${attempt}/${retries})`);
        logger.info('Request params:', JSON.stringify(params, null, 2));

        const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
          params,
          timeout: 30000 // 30 second timeout
        });

        logger.info('NewsAPI response received:', {
          status: response.status,
          dataStatus: response.data.status,
          articlesCount: response.data.articles?.length || 0
        });

        if (response.data.status !== 'ok') {
          throw new Error(`NewsAPI error: ${response.data.message}`);
        }

        const articles = response.data.articles || [];
        logger.logFetchNews(articles.length);

        // Log API usage warnings
        if (articles.length < 100) {
          logger.warn(`Low article count: ${articles.length} articles fetched`);
        }

        return articles;
        
      } catch (error) {
        lastError = error;
        logger.error(`NewsAPI attempt ${attempt} failed:`, error.message);
        logger.error('Detailed error info:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        
        if (attempt < retries) {
          logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError;
  } catch (error) {
    logger.logError('fetchFromNewsAPI', error);
    throw error;
  }
}

/**
 * Fetch articles for trending topics
 * @param {string} keyword - The trending keyword
 * @param {number} pageSize - Number of articles to fetch (default: 8)
 * @returns {Promise<Array>} - Array of articles for the keyword
 */
async function fetchArticlesForTrend(keyword, pageSize = 8) {
  try {
    logger.info(`Fetching articles for trend: ${keyword}`);
    
    const articles = await fetchFromNewsAPI(keyword, {
      pageSize,
      sources: TRUSTED_SOURCES.join(',')
    });

    return articles;
  } catch (error) {
    logger.logError('fetchArticlesForTrend', error);
    throw error;
  }
}

/**
 * Fetch initial articles for trend analysis
 * @returns {Promise<Array>} - Array of articles for trend analysis
 */
async function fetchInitialArticles() {
  try {
    // TEMPORARY TEST DATA - REMOVE AFTER TESTING
    // Check if we should use test data (for development/testing purposes)
    // if (process.env.FORCE_TEST_DATA === 'true') {
    //   // TEMPORARY TEST DATA - REMOVE AFTER TESTING
    //   // Hard-coded test articles to verify pipeline works correctly
    //   // These articles contain high-frequency keywords to guarantee trend detection
    //   logger.info('Using TEMPORARY TEST DATA instead of NewsAPI - REMOVE AFTER TESTING');
    //   console.log('🔧 TEST MODE: Using injected test articles for trend simulation');
    //   
    //   const testArticles = [
    //     // ... test articles would go here ...
    //   ];
    //   
    //   return testArticles;
    // }
    
    // ORIGINAL CODE - Use when FORCE_TEST_DATA is not set to 'true'
    logger.info('Fetching articles from NewsAPI');
    
    // Keywords from the original n8n workflow
    const keywords = [
      'war OR conflict OR attack OR battle OR military OR defense',
      'politics OR election OR president OR government OR diplomacy',
      'sanctions OR nato OR ukraine OR russia OR china',
      'cyber OR insurgency OR coup OR referendum OR summit',
      'arms OR missile OR invasion OR ceasefire OR troops'
    ];

    const query = keywords.join(' OR ');
    
    // Get articles from the last day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = yesterday.toISOString().split('T')[0];

    const articles = await fetchFromNewsAPI(query, {
      pageSize: 100, // NewsAPI free tier limit
      from: fromDate,
      sortBy: 'publishedAt'
    });

    return articles;
  } catch (error) {
    logger.logError('fetchInitialArticles', error);
    throw error;
  }
}

/**
 * Validate and clean article data
 * @param {Array} articles - Raw articles from API
 * @returns {Array} - Cleaned articles
 */
function cleanArticles(articles) {
  if (!articles || !Array.isArray(articles)) {
    return [];
  }
  
  return articles
    .filter(article => {
      // Filter out articles without required fields
      return article.title && 
             article.description && 
             article.url &&
             article.publishedAt;
    })
    .map(article => ({
      title: article.title.trim(),
      description: article.description.trim(),
      url: article.url,
      urlToImage: article.urlToImage || '',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      content: article.content || ''
    }));
}

/**
 * Main function to fetch news articles
 * @param {string} source - News source ('newsapi', 'twitter', 'rss', etc.)
 * @param {Object} options - Source-specific options
 * @returns {Promise<Array>} - Array of cleaned articles
 */
async function fetchNews(source = 'newsapi', options = {}) {
  try {
    let articles = [];

    switch (source.toLowerCase()) {
      case 'newsapi':
        if (options.query) {
          articles = await fetchFromNewsAPI(options.query, options);
        } else {
          articles = await fetchInitialArticles();
        }
        break;
      
      // Future sources can be added here
      case 'twitter':
        throw new Error('Twitter source not implemented yet');
      
      case 'rss':
        throw new Error('RSS source not implemented yet');
      
      default:
        throw new Error(`Unknown news source: ${source}`);
    }

    const cleanedArticles = cleanArticles(articles);
    logger.info(`Cleaned ${cleanedArticles.length} articles from ${articles.length} raw articles`);
    
    return cleanedArticles;
  } catch (error) {
    logger.logError('fetchNews', error);
    throw error;
  }
}

module.exports = {
  fetchNews,
  fetchFromNewsAPI,
  fetchArticlesForTrend,
  fetchInitialArticles,
  cleanArticles,
  TRUSTED_SOURCES
}; 