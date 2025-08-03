/**
 * Debug script for NewsAPI connection testing
 * Run with: node debug-newsapi.js
 */

require('dotenv').config();
const axios = require('axios');

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

console.log('=== NewsAPI Debug Test ===');
console.log('API Key present:', !!NEWS_API_KEY);
console.log('API Key length:', NEWS_API_KEY ? NEWS_API_KEY.length : 0);
console.log('API Key preview:', NEWS_API_KEY ? `${NEWS_API_KEY.substring(0, 10)}...` : 'NOT SET');

if (!NEWS_API_KEY) {
  console.error('❌ NEWS_API_KEY is not configured in .env file');
  process.exit(1);
}

async function testNewsAPI() {
  try {
    console.log('\n=== Testing NewsAPI Connection ===');
    
    // Test 1: Basic everything endpoint
    console.log('Test 1: Basic everything endpoint');
    const params = {
      q: 'war OR conflict',
      pageSize: 10,
      sortBy: 'publishedAt',
      apiKey: NEWS_API_KEY
    };
    
    console.log('Request URL:', `${NEWS_API_BASE_URL}/everything`);
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params,
      timeout: 30000
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data status:', response.data.status);
    console.log('✅ Articles count:', response.data.articles?.length || 0);
    
    if (response.data.articles && response.data.articles.length > 0) {
      console.log('✅ First article title:', response.data.articles[0].title);
    }
    
    // Test 2: With sources parameter
    console.log('\nTest 2: With sources parameter');
    const paramsWithSources = {
      q: 'war OR conflict',
      pageSize: 10,
      sources: 'cnn,bbc-news,reuters',
      sortBy: 'publishedAt',
      apiKey: NEWS_API_KEY
    };
    
    const response2 = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params: paramsWithSources,
      timeout: 30000
    });
    
    console.log('✅ Response 2 status:', response2.status);
    console.log('✅ Response 2 data status:', response2.data.status);
    console.log('✅ Articles count:', response2.data.articles?.length || 0);
    
    // Test 3: Check API usage
    console.log('\nTest 3: API Usage Check');
    console.log('Response headers:', JSON.stringify(response.headers, null, 2));
    
    // Check for rate limiting headers
    const rateLimitHeaders = [
      'x-ratelimit-requests-remaining',
      'x-ratelimit-requests-limit',
      'x-ratelimit-reset'
    ];
    
    rateLimitHeaders.forEach(header => {
      if (response.headers[header]) {
        console.log(`✅ ${header}:`, response.headers[header]);
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ NewsAPI test failed:');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    }
    
    if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request details:', error.request);
    }
    
    return false;
  }
}

async function testWithDateFilter() {
  try {
    console.log('\n=== Testing with Date Filter ===');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = yesterday.toISOString().split('T')[0];
    
    console.log('From date:', fromDate);
    
    const params = {
      q: 'war OR conflict OR attack OR battle OR military OR defense',
      pageSize: 100,
      from: fromDate,
      sortBy: 'publishedAt',
      apiKey: NEWS_API_KEY
    };
    
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params,
      timeout: 30000
    });
    
    console.log('✅ Date filter test successful');
    console.log('✅ Articles count:', response.data.articles?.length || 0);
    
    return true;
    
  } catch (error) {
    console.error('❌ Date filter test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function runTests() {
  console.log('Starting NewsAPI tests...\n');
  
  const test1Result = await testNewsAPI();
  const test2Result = await testWithDateFilter();
  
  console.log('\n=== Test Results ===');
  console.log('Basic API test:', test1Result ? '✅ PASSED' : '❌ FAILED');
  console.log('Date filter test:', test2Result ? '✅ PASSED' : '❌ FAILED');
  
  if (test1Result && test2Result) {
    console.log('\n🎉 All tests passed! NewsAPI is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
}

runTests().catch(console.error); 