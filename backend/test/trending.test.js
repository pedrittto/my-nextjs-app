/**
 * Unit tests for trending module
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { 
  computeTrendingKeywords, 
  selectTrendingTopic, 
  analyzeTrends, 
  prepareTrendData,
  TOPIC_KEYWORDS,
  HOT_TOPICS,
  MIN_COUNT,
  HOT_TOPIC_COUNT
} = require('../trending');

describe('trending module', () => {
  test('computeTrendingKeywords should extract trending keywords from articles', () => {
    const mockArticles = [
      {
        title: 'War in Ukraine continues as Russia attacks',
        description: 'The war in Ukraine continues with Russian military attacks'
      },
      {
        title: 'NATO responds to Russian aggression',
        description: 'NATO military alliance responds to Russian aggression in Ukraine'
      },
      {
        title: 'President Biden discusses Ukraine conflict',
        description: 'US President Biden discusses the ongoing conflict in Ukraine'
      },
      {
        title: 'Weather forecast for tomorrow',
        description: 'Sunny weather expected tomorrow' // Non-topic content
      }
    ];

    const trends = computeTrendingKeywords(mockArticles, 10);

    // Should find topic keywords
    assert(trends.length > 0);
    
    // Check that war-related keywords are found
    const keywords = trends.map(([keyword]) => keyword);
    assert(keywords.includes('war') || keywords.includes('ukraine') || keywords.includes('russia'));
  });

  test('computeTrendingKeywords should handle empty articles array', () => {
    const trends = computeTrendingKeywords([], 10);
    assert.deepStrictEqual(trends, []);
  });

  test('computeTrendingKeywords should handle null articles', () => {
    const trends = computeTrendingKeywords(null, 10);
    assert.deepStrictEqual(trends, []);
  });

  test('selectTrendingTopic should select topic meeting threshold', () => {
    const trends = [
      ['war', 10], // Meets regular threshold
      ['politics', 5], // Below threshold
      ['conflict', 8] // Meets regular threshold
    ];

    const selected = selectTrendingTopic(trends, []);
    
    assert.strictEqual(selected, 'war'); // Should select the first one that meets threshold
  });

  test('selectTrendingTopic should apply higher threshold for hot topics', () => {
    const trends = [
      ['trump', 15], // Below hot topic threshold (18)
      ['war', 10], // Meets regular threshold (7)
      ['russia', 20] // Meets hot topic threshold (18)
    ];

    const selected = selectTrendingTopic(trends, []);
    
    // Should select the first topic that meets its threshold (war with count 10 >= 7)
    assert.strictEqual(selected, 'war');
  });

  test('selectTrendingTopic should avoid recent trends', () => {
    const trends = [
      ['war', 10],
      ['conflict', 8]
    ];

    const recentTrends = ['war']; // 'war' was recently used

    const selected = selectTrendingTopic(trends, recentTrends);
    
    assert.strictEqual(selected, 'conflict'); // Should select 'conflict' since 'war' is recent
  });

  test('selectTrendingTopic should return null if no topics meet criteria', () => {
    const trends = [
      ['politics', 5], // Below threshold
      ['election', 3] // Below threshold
    ];

    const selected = selectTrendingTopic(trends, []);
    
    assert.strictEqual(selected, null);
  });

  test('analyzeTrends should return complete trend analysis', () => {
    const mockArticles = [
      {
        title: 'War war war in Ukraine continues as Russia attacks',
        description: 'The war war war in Ukraine continues with Russian military attacks war war'
      },
      {
        title: 'NATO responds to Russian aggression war war',
        description: 'NATO military alliance responds to Russian aggression in Ukraine war war'
      },
      {
        title: 'President Biden discusses Ukraine conflict war war',
        description: 'US President Biden discusses the ongoing conflict in Ukraine war war'
      },
      {
        title: 'More war news from the front lines',
        description: 'War continues as troops advance war war war'
      }
    ];

    const result = analyzeTrends(mockArticles, []);

    assert(result !== null);
    assert.strictEqual(typeof result.keyword, 'string');
    assert.strictEqual(typeof result.count, 'number');
    assert(Array.isArray(result.allTrends));
  });

  test('analyzeTrends should return null if no suitable trend found', () => {
    const mockArticles = [
      {
        title: 'Weather is sunny today',
        description: 'Beautiful sunny weather expected throughout the day'
      }
    ];

    const result = analyzeTrends(mockArticles, []);
    
    assert.strictEqual(result, null);
  });

  test('prepareTrendData should extract image URL from articles', () => {
    const mockArticles = [
      {
        title: 'Test Article 1',
        description: 'Test description',
        urlToImage: 'https://valid-image.com/image1.jpg'
      },
      {
        title: 'Test Article 2',
        description: 'Test description',
        urlToImage: 'https://valid-image.com/image2.jpg'
      }
    ];

    const result = prepareTrendData(mockArticles, 'test');

    assert.strictEqual(result.trend, 'test');
    assert.deepStrictEqual(result.articles, mockArticles);
    assert.strictEqual(result.image_url, 'https://valid-image.com/image1.jpg'); // Should select first valid image
  });

  test('prepareTrendData should handle missing image URLs', () => {
    const mockArticles = [
      {
        title: 'Test Article',
        description: 'Test description'
        // No urlToImage
      }
    ];

    const result = prepareTrendData(mockArticles, 'test');

    assert.strictEqual(result.trend, 'test');
    assert.strictEqual(result.image_url, '');
  });

  test('prepareTrendData should filter out invalid image URLs', () => {
    const mockArticles = [
      {
        title: 'Test Article 1',
        description: 'Test description',
        urlToImage: 'https://valid-image.com/image.jpg' // Valid
      },
      {
        title: 'Test Article 2',
        description: 'Test description',
        urlToImage: 'not-a-url' // Invalid
      },
      {
        title: 'Test Article 3',
        description: 'Test description',
        urlToImage: 'https://example.com/example.com/image.jpg' // Contains 'example.com'
      }
    ];

    const result = prepareTrendData(mockArticles, 'test');

    assert.strictEqual(result.image_url, 'https://valid-image.com/image.jpg'); // Should select first valid image
  });

  test('TOPIC_KEYWORDS should contain expected keywords', () => {
    const expectedKeywords = [
      'war', 'conflict', 'attack', 'battle', 'military', 'defense',
      'ceasefire', 'invasion', 'troops', 'weapon', 'sanctions',
      'diplomacy', 'politics', 'election', 'president', 'nato',
      'china', 'russia', 'united', 'states'
    ];

    expectedKeywords.forEach(keyword => {
      assert(TOPIC_KEYWORDS.has(keyword), `Missing keyword: ${keyword}`);
    });
  });

  test('HOT_TOPICS should contain expected hot topics', () => {
    const expectedHotTopics = [
      'trump', 'russia', 'ukraine', 'biden', 'putin', 'zelensky',
      'china', 'united', 'states', 'israel', 'palestine', 'nato', 'usa'
    ];

    assert.deepStrictEqual(HOT_TOPICS, expectedHotTopics);
  });

  test('Thresholds should have correct values', () => {
    assert.strictEqual(MIN_COUNT, 7);
    assert.strictEqual(HOT_TOPIC_COUNT, 18);
  });
}); 