/**
 * Main entry point for the news generation backend
 * Orchestrates the entire workflow: fetch → analyze → summarize → store
 */

require('dotenv').config();
const express = require('express');
const cron = require('cron');
const logger = require('./logger');
const { fetchNews, fetchArticlesForTrend } = require('./fetchNews');
const { analyzeTrends, prepareTrendData } = require('./trending');
const { generateSummary, validateSummary } = require('./summarizer');
const { initializeFirestore, writeArticle, checkDuplicate, getRecentArticles } = require('./firestore');
const { getModelStatus, detectBestModel, resetModelDetection } = require('./modelManager');
const { initializeAutonomousProcessing, runAutonomousProcessing, CONFIG } = require('./autonomousProcessor');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Simple root endpoint
app.get('/', (req, res) => {
  res.send('Pulse backend is alive');
});

/**
 * Main workflow function that processes news generation
 * @returns {Promise<Object|null>} - Generated article data or null if no article generated
 */
async function generateNewsArticle() {
  try {
    logger.info('Starting news generation workflow');

    // Step 1: Initialize Firestore
    initializeFirestore();

    // Step 2: Fetch initial articles for trend analysis
    logger.info('Step 1: Fetching initial articles for trend analysis');
    const initialArticles = await fetchNews('newsapi');
    
    if (!initialArticles || initialArticles.length === 0) {
      logger.warn('No articles fetched for trend analysis');
      return null;
    }

    // Step 3: Analyze trends and select the best one
    logger.info('Step 2: Analyzing trends');
    const recentArticles = await getRecentArticles(24);
    const recentTrends = recentArticles.map(article => 
      article.title_en.toLowerCase().split(' ').find(word => 
        ['war', 'conflict', 'attack', 'battle', 'military', 'defense', 'politics', 'election', 'president', 'government', 'diplomacy', 'sanctions', 'nato', 'ukraine', 'russia', 'china'].includes(word)
      )
    ).filter(Boolean);

    const trendAnalysis = analyzeTrends(initialArticles, recentTrends);
    
    if (!trendAnalysis) {
      logger.info('No suitable trending topic found');
      return null;
    }

    // Step 4: Fetch detailed articles for the selected trend
    logger.info('Step 3: Fetching detailed articles for selected trend');
    const trendArticles = await fetchArticlesForTrend(trendAnalysis.keyword, 8);
    
    if (!trendArticles || trendArticles.length === 0) {
      logger.warn('No articles found for the selected trend');
      return null;
    }

    // Step 4.5: Prepare trend data and select best image
    logger.info('Step 3.5: Preparing trend data and selecting image');
    const trendData = prepareTrendData(trendArticles, trendAnalysis.keyword);
    logger.info('Selected image URL:', { image_url: trendData.image_url });

    // Step 5: Generate summary using OpenAI (with automatic model fallback)
    logger.info('Step 4: Generating summary with OpenAI');
    const summaryData = await generateSummary(trendArticles, trendAnalysis.keyword, trendData.image_url);
    
    if (!summaryData || !validateSummary(summaryData)) {
      logger.warn('Generated summary is invalid');
      return null;
    }

    // Step 6: Check for duplicates
    logger.info('Step 5: Checking for duplicates');
    const isDuplicate = await checkDuplicate(summaryData);
    
    if (isDuplicate) {
      logger.info('Article is a duplicate, skipping');
      return null;
    }

    // Step 7: Write to Firestore
    logger.info('Step 6: Writing article to Firestore');
    const documentId = await writeArticle(summaryData);
    
    logger.info('News generation workflow completed successfully', {
      documentId,
      title: summaryData.title_en,
      credibility_score: summaryData.credibility_score
    });

    return {
      documentId,
      ...summaryData
    };

  } catch (error) {
    logger.logError('generateNewsArticle', error);
    throw error;
  }
}

/**
 * Express route to manually trigger news generation
 */
app.post('/generate', async (req, res) => {
  try {
    logger.info('Manual news generation requested');
    
    const result = await generateNewsArticle();
    
    if (result) {
      res.json({
        success: true,
        message: 'News article generated successfully',
        data: result
      });
    } else {
      res.json({
        success: false,
        message: 'No suitable news article could be generated'
      });
    }
  } catch (error) {
    logger.logError('POST /generate', error);
    res.status(500).json({
      success: false,
      message: 'Error generating news article',
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const modelStatus = getModelStatus();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    model: modelStatus.activeModel || 'not_detected'
  });
});

/**
 * Status endpoint to check configuration
 */
app.get('/status', (req, res) => {
  const config = {
    newsApiKey: !!process.env.NEWS_API_KEY,
    openaiApiKey: !!process.env.OPENAI_API_KEY,
    firebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    firebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    firebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
  };

  const allConfigured = Object.values(config).every(Boolean);
  const modelStatus = getModelStatus();

  res.json({
    configured: allConfigured,
    config,
    model: modelStatus,
    timestamp: new Date().toISOString()
  });
});

/**
 * Model detection endpoint (for testing and debugging)
 */
app.post('/detect-model', async (req, res) => {
  try {
    logger.info('Manual model detection requested');
    
    resetModelDetection();
    const detectedModel = await detectBestModel();
    
    res.json({
      success: true,
      message: 'Model detection completed',
      detectedModel: detectedModel,
      modelStatus: getModelStatus()
    });
  } catch (error) {
    logger.logError('POST /detect-model', error);
    res.status(500).json({
      success: false,
      message: 'Error during model detection',
      error: error.message
    });
  }
});

/**
 * Manual autonomous processing endpoint
 */
app.post('/autonomous-process', async (req, res) => {
  try {
    logger.info('Manual autonomous processing requested');
    
    const results = await runAutonomousProcessing();
    
    res.json({
      success: true,
      message: 'Autonomous processing completed',
      results: results
    });
  } catch (error) {
    logger.logError('POST /autonomous-process', error);
    res.status(500).json({
      success: false,
      message: 'Error during autonomous processing',
      error: error.message
    });
  }
});

/**
 * Autonomous processing status endpoint
 */
app.get('/autonomous-status', (req, res) => {
  res.json({
    status: 'active',
    configuration: CONFIG,
    timestamp: new Date().toISOString(),
    nextRun: 'Every 30 minutes',
    description: 'Autonomous news processing pipeline'
  });
});

/**
 * Set up autonomous processing with enhanced cron scheduling
 */
function setupAutonomousProcessing() {
  // Initialize the autonomous processing system
  const autonomousJob = initializeAutonomousProcessing();
  
  // Also keep the legacy cron job for backward compatibility
  const legacyCronSchedule = process.env.CRON_SCHEDULE || '0 */2 * * *'; // Every 2 hours by default
  
  const legacyJob = new cron.CronJob(legacyCronSchedule, async () => {
    logger.info('Legacy cron job triggered - starting manual news generation');
    
    try {
      await generateNewsArticle();
    } catch (error) {
      logger.logError('Legacy cron job execution', error);
    }
  }, null, false, 'UTC');

  legacyJob.start();
  logger.info(`Legacy cron job scheduled with pattern: ${legacyCronSchedule}`);
  
  return { autonomousJob, legacyJob };
}

/**
 * Start the server
 */
function startServer() {
  // Initialize Firestore
  try {
    initializeFirestore();
  } catch (error) {
    logger.error('Failed to initialize Firestore', error);
    process.exit(1);
  }

  // Set up autonomous processing
  setupAutonomousProcessing();

  // Start Express server
  app.listen(PORT, () => {
    logger.info(`News generation backend started on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`Status check: http://localhost:${PORT}/status`);
    logger.info(`Manual generation: POST http://localhost:${PORT}/generate`);
    logger.info(`Model detection: POST http://localhost:${PORT}/detect-model`);
    logger.info(`Autonomous processing: POST http://localhost:${PORT}/autonomous-process`);
    logger.info(`Autonomous status: GET http://localhost:${PORT}/autonomous-status`);
    logger.info(`Autonomous processing runs every 30 minutes automatically`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = {
  generateNewsArticle,
  app
}; 