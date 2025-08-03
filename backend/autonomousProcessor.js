/**
 * Autonomous News Processing Pipeline
 * 
 * This module implements a fully autonomous news processing system that:
 * - Fetches news automatically every 30 minutes
 * - Analyzes articles for trending topics and significant events
 * - Only generates news cards when something noteworthy is detected
 * - Handles API limits and outages gracefully
 * 
 * Configuration:
 * - FETCH_INTERVAL: 30 minutes (1800000 ms)
 * - MIN_ARTICLES: 100 articles minimum per fetch
 * - TREND_THRESHOLD: Minimum articles needed for a topic to be "interesting"
 * - TIME_WINDOW: 24 hours for trend analysis
 * - MAX_ARTICLES_PER_FETCH: 200 (NewsAPI free tier limit)
 */

const logger = require('./logger');
const { fetchNews, fetchFromNewsAPI } = require('./fetchNews');
const { analyzeTrends, prepareTrendData } = require('./trending');
const { generateSummary, validateSummary } = require('./summarizer');
const { writeArticle, checkDuplicate, getRecentArticles } = require('./firestore');

// Configuration constants
const CONFIG = {
  // Scheduling
  FETCH_INTERVAL: 30 * 60 * 1000, // 30 minutes in milliseconds
  CRON_SCHEDULE: '*/30 * * * *',   // Every 30 minutes
  
  // News fetching
  MIN_ARTICLES: 50,                // Minimum articles to fetch (reduced for free tier)
  MAX_ARTICLES_PER_FETCH: 100,     // Maximum articles per fetch (NewsAPI free tier limit)
  
  // Trend detection thresholds
  TREND_THRESHOLD: 15,             // Minimum articles for a topic to be "interesting"
  TIME_WINDOW_HOURS: 24,           // Time window for trend analysis
  MIN_UNIQUE_SOURCES: 3,           // Minimum unique sources for credibility
  
  // Topic clustering
  KEYWORD_SIMILARITY_THRESHOLD: 0.7, // Similarity threshold for topic clustering
  MAX_TOPICS_PER_CYCLE: 3,         // Maximum topics to process per cycle
  
  // Error handling
  MAX_RETRIES: 3,                  // Maximum retries for API calls
  RETRY_DELAY: 5000,               // Delay between retries (5 seconds)
  
  // Logging
  LOG_DETAILED_ANALYSIS: true,     // Log detailed trend analysis
  LOG_API_USAGE: true              // Log API usage statistics
};

/**
 * Enhanced news fetching with automatic retry and limit handling
 * @returns {Promise<Array>} - Array of articles
 */
async function fetchLatestNews() {
  let retries = 0;
  
  while (retries < CONFIG.MAX_RETRIES) {
    try {
      logger.info(`Fetching latest news (attempt ${retries + 1}/${CONFIG.MAX_RETRIES})`);
      
      // Fetch articles from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fromDate = yesterday.toISOString().split('T')[0];
      
      // Keywords for war/politics focus
      const keywords = [
        'war OR conflict OR attack OR battle OR military OR defense',
        'politics OR election OR president OR government OR diplomacy',
        'sanctions OR nato OR ukraine OR russia OR china',
        'cyber OR insurgency OR coup OR referendum OR summit',
        'arms OR missile OR invasion OR ceasefire OR troops'
      ];
      
      const query = keywords.join(' OR ');
      
      logger.info('NewsAPI request details:', {
        query: query,
        pageSize: CONFIG.MAX_ARTICLES_PER_FETCH,
        fromDate: fromDate,
        sortBy: 'publishedAt'
      });
      
      const articles = await fetchFromNewsAPI(query, {
        pageSize: CONFIG.MAX_ARTICLES_PER_FETCH,
        from: fromDate,
        sortBy: 'publishedAt'
      });
      
      logger.info(`Raw articles received: ${articles.length}`);
      
      if (articles.length < CONFIG.MIN_ARTICLES) {
        logger.warn(`Only fetched ${articles.length} articles (minimum: ${CONFIG.MIN_ARTICLES})`);
      } else {
        logger.info(`Successfully fetched ${articles.length} articles`);
      }
      
      if (CONFIG.LOG_API_USAGE) {
        logger.info('API Usage Statistics', {
          articles_fetched: articles.length,
          time_window: '24 hours',
          sources_queried: 'trusted sources only'
        });
      }
      
      return articles;
      
    } catch (error) {
      retries++;
      logger.error(`News fetching attempt ${retries} failed:`, error.message);
      logger.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (retries < CONFIG.MAX_RETRIES) {
        logger.info(`Retrying in ${CONFIG.RETRY_DELAY / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      } else {
        logger.error('All retry attempts failed for news fetching');
        throw error;
      }
    }
  }
}

/**
 * Advanced trend detection with topic clustering
 * @param {Array} articles - Array of articles to analyze
 * @returns {Promise<Array>} - Array of detected trends with metadata
 */
async function detectSignificantTrends(articles) {
  try {
    if (!articles || articles.length === 0) {
      logger.warn('No articles provided for trend detection');
      return [];
    }
    
    logger.info(`Analyzing ${articles.length} articles for significant trends`);
    
    // Get recent articles to avoid duplicates
    const recentArticles = await getRecentArticles(CONFIG.TIME_WINDOW_HOURS);
    const recentTrends = recentArticles.map(article => 
      article.title_en.toLowerCase().split(' ').find(word => 
        ['war', 'conflict', 'attack', 'battle', 'military', 'defense', 'politics', 'election', 'president', 'government', 'diplomacy', 'sanctions', 'nato', 'ukraine', 'russia', 'china'].includes(word)
      )
    ).filter(Boolean);
    
    // Analyze trends using existing logic
    const trendAnalysis = analyzeTrends(articles, recentTrends);
    
    if (!trendAnalysis) {
      logger.info('No significant trends detected');
      return [];
    }
    
    // Enhanced trend filtering with special thresholds
    const significantTrends = [];
    const { SPECIAL_TREND_THRESHOLDS } = require('./trending');
    
    for (const [keyword, count] of trendAnalysis.allTrends) {
      const kw = keyword.toLowerCase();
      
      // Count unique sources for this topic
      const topicArticles = articles.filter(article => 
        article.title.toLowerCase().includes(kw) || 
        article.description.toLowerCase().includes(kw)
      );
      
      const uniqueSources = new Set(topicArticles.map(article => article.source)).size;
      
      // Check if this keyword has special thresholds
      const specialThreshold = SPECIAL_TREND_THRESHOLDS[kw];
      
      if (specialThreshold) {
        // Use special thresholds for high-frequency keywords
        if (count >= specialThreshold.minCount && uniqueSources >= specialThreshold.minSources) {
          logger.info(`High-frequency keyword "${kw}" qualified with special thresholds:`, {
            count,
            requiredCount: specialThreshold.minCount,
            sources: uniqueSources,
            requiredSources: specialThreshold.minSources,
            category: specialThreshold.description
          });
          
          significantTrends.push({
            keyword: kw,
            count: count,
            uniqueSources: uniqueSources,
            articles: topicArticles,
            significance: calculateSignificance(count, uniqueSources, topicArticles.length),
            category: specialThreshold.description
          });
        } else {
          // Log why this high-frequency keyword was filtered out
          logger.info(`High-frequency keyword "${kw}" filtered out by special thresholds:`, {
            count,
            requiredCount: specialThreshold.minCount,
            sources: uniqueSources,
            requiredSources: specialThreshold.minSources,
            category: specialThreshold.description,
            reason: count < specialThreshold.minCount ? 'insufficient_articles' : 'insufficient_sources'
          });
        }
      } else {
        // Use standard thresholds for regular topics
        if (count >= CONFIG.TREND_THRESHOLD && uniqueSources >= CONFIG.MIN_UNIQUE_SOURCES) {
          significantTrends.push({
            keyword: kw,
            count: count,
            uniqueSources: uniqueSources,
            articles: topicArticles,
            significance: calculateSignificance(count, uniqueSources, topicArticles.length),
            category: 'regular_topic'
          });
        }
      }
    }
    
    // Sort by significance and limit to top topics
    significantTrends.sort((a, b) => b.significance - a.significance);
    const topTrends = significantTrends.slice(0, CONFIG.MAX_TOPICS_PER_CYCLE);
    
    if (CONFIG.LOG_DETAILED_ANALYSIS) {
      logger.info('Trend Analysis Results', {
        total_articles: articles.length,
        trends_detected: significantTrends.length,
        top_trends: topTrends.map(t => ({
          keyword: t.keyword,
          count: t.count,
          sources: t.uniqueSources,
          significance: t.significance.toFixed(2)
        }))
      });
    }
    
    return topTrends;
    
  } catch (error) {
    logger.logError('detectSignificantTrends', error);
    return [];
  }
}

/**
 * Calculate trend significance score
 * @param {number} count - Number of articles mentioning the topic
 * @param {number} uniqueSources - Number of unique sources
 * @param {number} totalArticles - Total articles analyzed
 * @returns {number} - Significance score (0-1)
 */
function calculateSignificance(count, uniqueSources, totalArticles) {
  const frequencyScore = count / totalArticles;
  const sourceDiversityScore = Math.min(uniqueSources / 10, 1); // Normalize to 0-1
  const recencyScore = 1; // Could be enhanced with time-based scoring
  
  return (frequencyScore * 0.4 + sourceDiversityScore * 0.4 + recencyScore * 0.2);
}

/**
 * Process a single significant trend and generate news card
 * @param {Object} trend - Trend object with metadata
 * @returns {Promise<Object|null>} - Generated news card or null
 */
async function processTrend(trend) {
  try {
    logger.info(`Processing trend: ${trend.keyword} (${trend.count} articles, ${trend.uniqueSources} sources)`);
    
    // Prepare trend data with image selection
    const trendData = prepareTrendData(trend.articles, trend.keyword);
    
    if (!trendData.image_url) {
      logger.warn(`No suitable image found for trend: ${trend.keyword}`);
    }
    
    // Generate summary
    const summaryData = await generateSummary(trend.articles, trend.keyword, trendData.image_url);
    
    if (!summaryData || !validateSummary(summaryData)) {
      logger.warn(`Generated summary is invalid for trend: ${trend.keyword}`);
      return null;
    }
    
    // Check for duplicates
    const isDuplicate = await checkDuplicate(summaryData);
    if (isDuplicate) {
      logger.info(`Duplicate article detected for trend: ${trend.keyword}`);
      return null;
    }
    
    // Write to Firestore
    const documentId = await writeArticle(summaryData);
    
    logger.info(`Successfully created news card for trend: ${trend.keyword}`, {
      documentId,
      title: summaryData.title_en,
      credibility_score: summaryData.credibility_score,
      image_url: summaryData.image_url ? 'present' : 'missing'
    });
    
    return {
      documentId,
      trend: trend.keyword,
      ...summaryData
    };
    
  } catch (error) {
    logger.logError('processTrend', error);
    return null;
  }
}

/**
 * Main autonomous processing function
 * @returns {Promise<Object>} - Processing results
 */
async function runAutonomousProcessing() {
  const startTime = new Date();
  const results = {
    startTime: startTime.toISOString(),
    articlesFetched: 0,
    trendsDetected: 0,
    cardsGenerated: 0,
    errors: [],
    processingTime: 0
  };
  
  try {
    logger.info('Starting autonomous news processing cycle');
    
    // Step 1: Fetch latest news
    const articles = await fetchLatestNews();
    results.articlesFetched = articles.length;
    
    if (articles.length < CONFIG.MIN_ARTICLES) {
      logger.warn(`Insufficient articles fetched (${articles.length}/${CONFIG.MIN_ARTICLES})`);
      results.errors.push(`Insufficient articles: ${articles.length}/${CONFIG.MIN_ARTICLES}`);
    }
    
    // Step 2: Detect significant trends
    const trends = await detectSignificantTrends(articles);
    results.trendsDetected = trends.length;
    
    if (trends.length === 0) {
      logger.info('No significant trends detected - skipping card generation');
      return results;
    }
    
    // Step 3: Process each significant trend
    const generatedCards = [];
    
    for (const trend of trends) {
      try {
        const card = await processTrend(trend);
        if (card) {
          generatedCards.push(card);
          results.cardsGenerated++;
        }
      } catch (error) {
        logger.error(`Error processing trend ${trend.keyword}:`, error.message);
        results.errors.push(`Trend processing error: ${trend.keyword} - ${error.message}`);
      }
    }
    
    // Log final results
    const endTime = new Date();
    results.processingTime = endTime.getTime() - startTime.getTime();
    
    logger.info('Autonomous processing cycle completed', {
      articles_fetched: results.articlesFetched,
      trends_detected: results.trendsDetected,
      cards_generated: results.cardsGenerated,
      processing_time_ms: results.processingTime,
      errors: results.errors.length
    });
    
    return results;
    
  } catch (error) {
    logger.logError('runAutonomousProcessing', error);
    results.errors.push(`Processing error: ${error.message}`);
    return results;
  }
}

/**
 * Initialize autonomous processing with cron scheduling
 * @returns {Object} - Cron job instance
 */
function initializeAutonomousProcessing() {
  const cron = require('cron');
  
  const job = new cron.CronJob(CONFIG.CRON_SCHEDULE, async () => {
    logger.info('Autonomous processing cron job triggered');
    
    try {
      await runAutonomousProcessing();
    } catch (error) {
      logger.logError('Autonomous processing cron job', error);
    }
  }, null, false, 'UTC');
  
  job.start();
  logger.info(`Autonomous processing scheduled with pattern: ${CONFIG.CRON_SCHEDULE}`);
  logger.info('Configuration:', CONFIG);
  
  return job;
}

module.exports = {
  runAutonomousProcessing,
  initializeAutonomousProcessing,
  detectSignificantTrends,
  fetchLatestNews,
  CONFIG
}; 