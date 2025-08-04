/**
 * Test script for multi-word phrase functionality
 */

require('dotenv').config();
const { analyzeTrends, computeTrendingKeywords } = require('./trending');

// Mock articles with multi-word phrases
const mockArticles = [
  {
    title: 'President Trump announces new policy on trade tariffs',
    description: 'President Trump has announced new tariffs on Chinese goods',
    source: 'CNN',
    url: 'https://example.com/1'
  },
  {
    title: 'Biden responds to Trump tariff announcement',
    description: 'President Biden criticized the new tariff policy from Trump',
    source: 'BBC',
    url: 'https://example.com/2'
  },
  {
    title: 'White House defends Trump tariff decision',
    description: 'The White House spokesperson defended the new tariffs by Trump',
    source: 'Reuters',
    url: 'https://example.com/3'
  },
  {
    title: 'US economy affected by Trump tariffs',
    description: 'The US economy shows signs of impact from Trump tariffs',
    source: 'Bloomberg',
    url: 'https://example.com/4'
  },
  {
    title: 'Trump campaign rallies continue across states',
    description: 'Trump continues his campaign rallies across the United States',
    source: 'Fox News',
    url: 'https://example.com/5'
  },
  {
    title: 'Biden campaign responds to Trump rallies',
    description: 'Biden campaign issues statement about Trump campaign rallies',
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
    title: 'US trade relations with China under scrutiny',
    description: 'The United States trade relations with China are under scrutiny',
    source: 'Washington Post',
    url: 'https://example.com/8'
  }
];

console.log('=== Testing Multi-Word Phrase Functionality ===');
console.log('Mock articles:', mockArticles.length);

// Test trend analysis
const result = analyzeTrends(mockArticles, []);

if (result) {
  console.log('✅ Trend analysis completed');
  console.log('Selected trend:', result.keyword);
  console.log('Count:', result.count);
  console.log('Is multi-word:', result.keyword.includes(' '));
  console.log('All trends:', result.allTrends.slice(0, 5)); // Show first 5
} else {
  console.log('❌ No trend selected');
}

console.log('\n=== Testing Direct Keyword Computation ===');
const keywords = computeTrendingKeywords(mockArticles, 10);
console.log('Top keywords/phrases:');
keywords.forEach(([keyword, count], index) => {
  console.log(`${index + 1}. "${keyword}" (${count} occurrences) - Multi-word: ${keyword.includes(' ')}`);
}); 