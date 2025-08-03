/**
 * Test script for improved trend filtering
 */

require('dotenv').config();
const { analyzeTrends, SPECIAL_TREND_THRESHOLDS } = require('./trending');

// Mock articles with high-frequency keywords
const mockArticles = [
  {
    title: 'Trump announces new policy on trade tariffs',
    description: 'President Trump has announced new tariffs on Chinese goods',
    source: 'CNN',
    url: 'https://example.com/1'
  },
  {
    title: 'Biden responds to Trump tariff announcement',
    description: 'President Biden criticized the new tariff policy',
    source: 'BBC',
    url: 'https://example.com/2'
  },
  {
    title: 'White House defends tariff decision',
    description: 'The White House spokesperson defended the new tariffs',
    source: 'Reuters',
    url: 'https://example.com/3'
  },
  {
    title: 'US economy affected by new tariffs',
    description: 'The US economy shows signs of impact from new tariffs',
    source: 'Bloomberg',
    url: 'https://example.com/4'
  },
  {
    title: 'Trump campaign rallies continue',
    description: 'Trump continues his campaign rallies across the US',
    source: 'Fox News',
    url: 'https://example.com/5'
  },
  {
    title: 'Biden campaign responds to Trump rallies',
    description: 'Biden campaign issues statement about Trump rallies',
    source: 'MSNBC',
    url: 'https://example.com/6'
  },
  {
    title: 'White House press briefing on economy',
    description: 'White House press secretary discusses economic policies',
    source: 'AP',
    url: 'https://example.com/7'
  },
  {
    title: 'US trade relations with China',
    description: 'The United States trade relations with China are under scrutiny',
    source: 'Washington Post',
    url: 'https://example.com/8'
  },
  {
    title: 'Trump leads in polls',
    description: 'Recent polls show Trump leading in key states',
    source: 'CNN',
    url: 'https://example.com/9'
  },
  {
    title: 'Biden campaign strategy',
    description: 'Biden campaign outlines new strategy for election',
    source: 'BBC',
    url: 'https://example.com/10'
  }
];

// Add more articles to test thresholds
for (let i = 11; i <= 40; i++) {
  mockArticles.push({
    title: `Trump news article ${i}`,
    description: `This is article ${i} about Trump`,
    source: `Source${i % 8}`,
    url: `https://example.com/${i}`
  });
}

console.log('=== Testing Improved Trend Filtering ===');
console.log('Special thresholds configured:', Object.keys(SPECIAL_TREND_THRESHOLDS).length);
console.log('Mock articles:', mockArticles.length);

// Test trend analysis
const result = analyzeTrends(mockArticles, []);

if (result) {
  console.log('✅ Trend analysis completed');
  console.log('Selected trend:', result.keyword);
  console.log('Count:', result.count);
  console.log('All trends:', result.allTrends);
} else {
  console.log('❌ No trend selected - filtering working correctly');
}

// Test individual keyword filtering
console.log('\n=== Testing Individual Keywords ===');
const testKeywords = ['trump', 'biden', 'tariff', 'white house', 'usa'];

testKeywords.forEach(keyword => {
  const threshold = SPECIAL_TREND_THRESHOLDS[keyword];
  if (threshold) {
    console.log(`${keyword}: ${threshold.minCount} articles, ${threshold.minSources} sources required`);
  } else {
    console.log(`${keyword}: No special threshold (uses standard)`);
  }
}); 