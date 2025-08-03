/**
 * Unit tests for fetchNews module
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { cleanArticles, TRUSTED_SOURCES } = require('../fetchNews');

describe('fetchNews module', () => {
  test('cleanArticles should filter and clean article data', () => {
    const mockArticles = [
      {
        title: 'Test Article 1',
        description: 'Test description 1',
        url: 'https://example.com/1',
        urlToImage: 'https://example.com/image1.jpg',
        source: { name: 'CNN' },
        publishedAt: '2023-01-01T00:00:00Z',
        content: 'Test content 1'
      },
      {
        title: '', // Invalid - missing title
        description: 'Test description 2',
        url: 'https://example.com/2',
        source: { name: 'BBC' },
        publishedAt: '2023-01-01T00:00:00Z'
      },
      {
        title: 'Test Article 3',
        description: null, // Invalid - missing description
        url: 'https://example.com/3',
        source: { name: 'Reuters' },
        publishedAt: '2023-01-01T00:00:00Z'
      },
      {
        title: 'Test Article 4',
        description: 'Test description 4',
        url: null, // Invalid - missing URL
        source: { name: 'Bloomberg' },
        publishedAt: '2023-01-01T00:00:00Z'
      },
      {
        title: 'Test Article 5',
        description: 'Test description 5',
        url: 'https://example.com/5',
        source: { name: 'Fox News' },
        publishedAt: null // Invalid - missing publishedAt
      }
    ];

    const cleaned = cleanArticles(mockArticles);

    // Should only have 1 valid article
    assert.strictEqual(cleaned.length, 1);
    
    // Check the valid article was cleaned properly
    const validArticle = cleaned[0];
    assert.strictEqual(validArticle.title, 'Test Article 1');
    assert.strictEqual(validArticle.description, 'Test description 1');
    assert.strictEqual(validArticle.url, 'https://example.com/1');
    assert.strictEqual(validArticle.urlToImage, 'https://example.com/image1.jpg');
    assert.strictEqual(validArticle.source, 'CNN');
    assert.strictEqual(validArticle.publishedAt, '2023-01-01T00:00:00Z');
    assert.strictEqual(validArticle.content, 'Test content 1');
  });

  test('cleanArticles should handle missing optional fields', () => {
    const mockArticles = [
      {
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com',
        source: { name: 'CNN' },
        publishedAt: '2023-01-01T00:00:00Z'
        // Missing urlToImage and content
      }
    ];

    const cleaned = cleanArticles(mockArticles);

    assert.strictEqual(cleaned.length, 1);
    assert.strictEqual(cleaned[0].urlToImage, '');
    assert.strictEqual(cleaned[0].content, '');
  });

  test('cleanArticles should trim whitespace', () => {
    const mockArticles = [
      {
        title: '  Test Article  ',
        description: '  Test description  ',
        url: 'https://example.com',
        source: { name: 'CNN' },
        publishedAt: '2023-01-01T00:00:00Z'
      }
    ];

    const cleaned = cleanArticles(mockArticles);

    assert.strictEqual(cleaned.length, 1);
    assert.strictEqual(cleaned[0].title, 'Test Article');
    assert.strictEqual(cleaned[0].description, 'Test description');
  });

  test('cleanArticles should handle unknown source', () => {
    const mockArticles = [
      {
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com',
        source: null, // Missing source
        publishedAt: '2023-01-01T00:00:00Z'
      }
    ];

    const cleaned = cleanArticles(mockArticles);

    assert.strictEqual(cleaned.length, 1);
    assert.strictEqual(cleaned[0].source, 'Unknown');
  });

  test('TRUSTED_SOURCES should contain expected sources', () => {
    const expectedSources = [
      'cnn',
      'bbc-news',
      'al-jazeera-english',
      'the-washington-post',
      'fox-news',
      'msnbc',
      'reuters',
      'bloomberg'
    ];

    assert.deepStrictEqual(TRUSTED_SOURCES, expectedSources);
  });

  test('cleanArticles should return empty array for empty input', () => {
    const cleaned = cleanArticles([]);
    assert.deepStrictEqual(cleaned, []);
  });

  test('cleanArticles should return empty array for null input', () => {
    const cleaned = cleanArticles(null);
    assert.deepStrictEqual(cleaned, []);
  });
}); 