/**
 * Trending analysis module
 * Analyzes articles to find trending topics and selects the most relevant ones
 */

const logger = require('./logger');

// Topic keywords from the original n8n workflow
const TOPIC_KEYWORDS = new Set([
  'war', 'conflict', 'attack', 'battle', 'military', 'defense',
  'ceasefire', 'invasion', 'troops', 'weapon', 'sanctions',
  'diplomacy', 'politics', 'election', 'president', 'nato',
  'china', 'russia', 'united', 'states'
]);

// Stop words for filtering
const STOP_WORDS = new Set([
  'and', 'the', 'of', 'to', 'in', 'on', 'is', 'a', 'for', 'with',
  'that', 'this', 'are', 'as', 'at', 'be', 'by', 'from', 'has',
  'he', 'it', 'its', 'may', 'not', 'or', 'she', 'was', 'will',
  'would', 'you', 'your', 'they', 'them', 'their', 'we', 'our',
  'us', 'i', 'me', 'my', 'but', 'if', 'so', 'than', 'then', 'up',
  'out', 'do', 'go', 'get', 'got', 'have', 'had', 'has', 'can',
  'could', 'should', 'would', 'might', 'must', 'shall', 'about',
  'after', 'against', 'between', 'during', 'into', 'through',
  'until', 'before', 'behind', 'below', 'beneath', 'beside',
  'beyond', 'inside', 'outside', 'under', 'over', 'above'
]);

// Special trend thresholds for high-frequency keywords that need stricter filtering
// These keywords require higher article counts and source diversity to qualify as trends
const SPECIAL_TREND_THRESHOLDS = {
  // US Politics - Very high thresholds due to constant coverage
  'trump': { minCount: 35, minSources: 8, description: 'US Politics - Trump' },
  'biden': { minCount: 30, minSources: 7, description: 'US Politics - Biden' },
  'president': { minCount: 25, minSources: 6, description: 'US Politics - President' },
  'white house': { minCount: 25, minSources: 6, description: 'US Politics - White House' },
  'usa': { minCount: 20, minSources: 5, description: 'US Politics - USA' },
  'us': { minCount: 20, minSources: 5, description: 'US Politics - US' },
  'united': { minCount: 20, minSources: 5, description: 'US Politics - United' },
  'states': { minCount: 20, minSources: 5, description: 'US Politics - States' },
  
  // Trade/Tariffs - High thresholds due to repetitive coverage
  'tariff': { minCount: 25, minSources: 6, description: 'Trade - Tariffs' },
  'cło': { minCount: 25, minSources: 6, description: 'Trade - Tariffs (PL)' },
  'trade': { minCount: 20, minSources: 5, description: 'Trade - General' },
  'commerce': { minCount: 20, minSources: 5, description: 'Trade - Commerce' },
  
  // High-frequency geopolitical topics
  'russia': { minCount: 25, minSources: 6, description: 'Geopolitics - Russia' },
  'ukraine': { minCount: 25, minSources: 6, description: 'Geopolitics - Ukraine' },
  'china': { minCount: 25, minSources: 6, description: 'Geopolitics - China' },
  'putin': { minCount: 25, minSources: 6, description: 'Geopolitics - Putin' },
  'zelensky': { minCount: 25, minSources: 6, description: 'Geopolitics - Zelensky' },
  
  // Other frequently covered topics
  'israel': { minCount: 20, minSources: 5, description: 'Geopolitics - Israel' },
  'palestine': { minCount: 20, minSources: 5, description: 'Geopolitics - Palestine' },
  'nato': { minCount: 20, minSources: 5, description: 'Military - NATO' },
  
  // Elections and political processes
  'election': { minCount: 25, minSources: 6, description: 'Politics - Elections' },
  'vote': { minCount: 20, minSources: 5, description: 'Politics - Voting' },
  'campaign': { minCount: 20, minSources: 5, description: 'Politics - Campaign' },
  
  // Economic terms that get over-covered
  'economy': { minCount: 20, minSources: 5, description: 'Economics - General' },
  'economic': { minCount: 20, minSources: 5, description: 'Economics - Economic' },
  'market': { minCount: 20, minSources: 5, description: 'Economics - Market' },
  'inflation': { minCount: 20, minSources: 5, description: 'Economics - Inflation' }
};

// Legacy hot topics (kept for backward compatibility)
const HOT_TOPICS = [
  'trump', 'russia', 'ukraine', 'biden', 'putin', 'zelensky',
  'china', 'united', 'states', 'israel', 'palestine', 'nato', 'usa'
];

// Standard thresholds for regular topics
const MIN_COUNT = 7;
const HOT_TOPIC_COUNT = 24; // Legacy threshold for hot topics

/**
 * Extract and count words from articles
 * @param {Array} articles - Array of articles
 * @returns {Object} - Word count object
 */
function extractWordCounts(articles) {
  const counts = {};
  
  // Combine all titles and descriptions
  const text = articles
    .map(article => `${article.title} ${article.description || ''}`.toLowerCase())
    .join(' ');

  // Clean and split text into words
  const words = text
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(word => word && word.length > 2); // Filter out short words

  // Count word occurrences
  words.forEach(word => {
    if (!STOP_WORDS.has(word)) {
      counts[word] = (counts[word] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Get top trending keywords from articles
 * @param {Array} articles - Array of articles
 * @param {number} limit - Number of top keywords to return (default: 20)
 * @returns {Array} - Array of [keyword, count] pairs
 */
function computeTrendingKeywords(articles, limit = 20) {
  try {
    if (!articles || articles.length === 0) {
      logger.warn('No articles provided for trending analysis');
      return [];
    }

    logger.info(`Analyzing ${articles.length} articles for trending topics`);

    const counts = extractWordCounts(articles);
    
    // Get top keywords by count
    const topKeywords = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Filter to topic keywords
    let filtered = topKeywords.filter(([keyword]) => TOPIC_KEYWORDS.has(keyword));

    // Ensure minimum of 2 trends
    if (filtered.length < 2) {
      filtered = topKeywords.slice(0, 2);
    }

    logger.logTrendingAnalysis(filtered);
    
    return filtered;
  } catch (error) {
    logger.logError('computeTrendingKeywords', error);
    return [];
  }
}

/**
 * Check if a keyword is novel (not in recent trends)
 * @param {string} keyword - The keyword to check
 * @param {Array} recentTrends - Array of recent trends
 * @returns {boolean} - True if keyword is novel
 */
function isNovel(keyword, recentTrends = []) {
  return !recentTrends.includes(keyword.toLowerCase());
}

/**
 * Select the best trending topic based on thresholds and novelty
 * @param {Array} trends - Array of [keyword, count] pairs
 * @param {Array} recentTrends - Array of recent trends to avoid duplicates
 * @param {Array} articles - Array of articles for source diversity calculation
 * @returns {string|null} - Selected trend or null if none meet criteria
 */
function selectTrendingTopic(trends, recentTrends = [], articles = []) {
  try {
    if (!trends || trends.length === 0) {
      logger.warn('No trends provided for selection');
      return null;
    }

    logger.info(`Selecting from ${trends.length} trending topics`);

    for (const [keyword, count] of trends) {
      const kw = keyword.toLowerCase();
      
      // Check if this keyword has special thresholds
      const specialThreshold = SPECIAL_TREND_THRESHOLDS[kw];
      
      if (specialThreshold) {
        // Calculate source diversity for this keyword
        const topicArticles = articles.filter(article => 
          article.title.toLowerCase().includes(kw) || 
          article.description.toLowerCase().includes(kw)
        );
        const uniqueSources = new Set(topicArticles.map(article => article.source)).size;
        
        // Check if it meets the special threshold requirements
        if (count >= specialThreshold.minCount && uniqueSources >= specialThreshold.minSources && isNovel(kw, recentTrends)) {
          logger.logTrendSelection(kw, {
            count,
            requiredCount: specialThreshold.minCount,
            sources: uniqueSources,
            requiredSources: specialThreshold.minSources,
            category: specialThreshold.description
          });
          return kw;
        } else {
          // Log why this high-frequency keyword was filtered out
          logger.info(`High-frequency keyword "${kw}" filtered out:`, {
            count,
            requiredCount: specialThreshold.minCount,
            sources: uniqueSources,
            requiredSources: specialThreshold.minSources,
            category: specialThreshold.description,
            reason: count < specialThreshold.minCount ? 'insufficient_articles' : 
                   uniqueSources < specialThreshold.minSources ? 'insufficient_sources' : 'not_novel'
          });
        }
      } else {
        // Use legacy threshold logic for regular topics
        const threshold = HOT_TOPICS.includes(kw) ? HOT_TOPIC_COUNT : MIN_COUNT;

        if (count >= threshold && isNovel(kw, recentTrends)) {
          logger.logTrendSelection(kw, { count, threshold, category: 'regular_topic' });
          return kw;
        }
      }
    }

    logger.info('No trending topic met the selection criteria');
    return null;
  } catch (error) {
    logger.logError('selectTrendingTopic', error);
    return null;
  }
}

/**
 * Main function to analyze trends and select the best one
 * @param {Array} articles - Array of articles to analyze
 * @param {Array} recentTrends - Array of recent trends to avoid duplicates
 * @returns {Object|null} - Selected trend object or null
 */
function analyzeTrends(articles, recentTrends = []) {
  try {
    // Compute trending keywords
    const trends = computeTrendingKeywords(articles);
    
    if (trends.length === 0) {
      return null;
    }

    // Select the best trending topic
    const selectedTrend = selectTrendingTopic(trends, recentTrends, articles);
    
    if (!selectedTrend) {
      return null;
    }

    // Find the count for the selected trend
    const trendData = trends.find(([keyword]) => keyword.toLowerCase() === selectedTrend);
    const count = trendData ? trendData[1] : 0;

    return {
      keyword: selectedTrend,
      count: count,
      allTrends: trends
    };
  } catch (error) {
    logger.logError('analyzeTrends', error);
    return null;
  }
}

/**
 * Prepare articles for a specific trend
 * @param {Array} articles - Array of articles
 * @param {string} trend - The trending keyword
 * @returns {Object} - Prepared data with trend, articles, and image
 */
function prepareTrendData(articles, trend) {
  try {
    // Enhanced image selection logic
    let bestImageUrl = '';
    let bestImageScore = 0;
    let firstValidImage = ''; // Fallback to first valid image
    
    for (const article of articles) {
      if (!article.urlToImage || 
          typeof article.urlToImage !== 'string' || 
          !article.urlToImage.startsWith('http') || 
          article.urlToImage.includes('example.com') ||
          article.urlToImage.length <= 10) {
        continue;
      }

      // Skip images with obvious watermarks or source logos
      const lowerUrl = article.urlToImage.toLowerCase();
      const watermarkIndicators = [
        'watermark', 'logo', 'brand', 'copyright', '©', 
        'getty', 'shutterstock', 'istock', 'alamy', 'fotolia', 'depositphotos'
      ];
      
      // Only filter out obvious stock photo watermarks, not news source logos
      const hasWatermark = watermarkIndicators.some(indicator => 
        lowerUrl.includes(indicator)
      );
      
      if (hasWatermark) {
        continue;
      }

      // Score the image based on quality indicators
      let score = 0;
      
      // Prefer images with higher resolution indicators
      if (lowerUrl.includes('large') || lowerUrl.includes('high') || lowerUrl.includes('hd')) {
        score += 3;
      }
      if (lowerUrl.includes('medium')) {
        score += 2;
      }
      if (lowerUrl.includes('small') || lowerUrl.includes('thumb')) {
        score += 1;
      }
      
      // Prefer images from trusted image hosting services
      const trustedHosts = ['imgur.com', 'flickr.com', 'unsplash.com', 'pexels.com'];
      const isTrustedHost = trustedHosts.some(host => lowerUrl.includes(host));
      if (isTrustedHost) {
        score += 2;
      }
      
      // Avoid images with obvious text or overlay indicators (but don't penalize too much)
      const textIndicators = ['text', 'overlay', 'caption', 'label'];
      const hasText = textIndicators.some(indicator => lowerUrl.includes(indicator));
      if (hasText) {
        score -= 0.5; // Reduced penalty
      }
      
      // Track first valid image as fallback
      if (!firstValidImage) {
        firstValidImage = article.urlToImage;
      }
      
      // Select the image with the highest score
      if (score > bestImageScore) {
        bestImageScore = score;
        bestImageUrl = article.urlToImage;
      }
    }

    // Use best scored image, or fallback to first valid image
    const selectedImage = bestImageUrl || firstValidImage;
    
    return {
      trend,
      articles,
      image_url: selectedImage
    };
  } catch (error) {
    logger.logError('prepareTrendData', error);
    return {
      trend,
      articles: [],
      image_url: ''
    };
  }
}

module.exports = {
  analyzeTrends,
  computeTrendingKeywords,
  selectTrendingTopic,
  prepareTrendData,
  TOPIC_KEYWORDS,
  HOT_TOPICS,
  MIN_COUNT,
  HOT_TOPIC_COUNT,
  SPECIAL_TREND_THRESHOLDS
}; 