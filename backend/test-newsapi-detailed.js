/**
 * Detailed NewsAPI test to replicate the autonomous processor call
 */

require('dotenv').config();
const axios = require('axios');

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

async function testExactCall() {
  try {
    console.log('=== Testing Exact Autonomous Processor Call ===');
    
    // Replicate the exact call from autonomousProcessor.js
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromDate = yesterday.toISOString().split('T')[0];
    
    const keywords = [
      'war OR conflict OR attack OR battle OR military OR defense',
      'politics OR election OR president OR government OR diplomacy',
      'sanctions OR nato OR ukraine OR russia OR china',
      'cyber OR insurgency OR coup OR referendum OR summit',
      'arms OR missile OR invasion OR ceasefire OR troops'
    ];
    
    const query = keywords.join(' OR ');
    
    console.log('Query:', query);
    console.log('From date:', fromDate);
    
    const params = {
      q: query,
      pageSize: 200,
      from: fromDate,
      sortBy: 'publishedAt',
      apiKey: NEWS_API_KEY
    };
    
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params,
      timeout: 30000
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Articles count:', response.data.articles?.length || 0);
    
  } catch (error) {
    console.error('❌ Failed with exact call:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
    
    // Try without sources parameter
    console.log('\n=== Testing without sources parameter ===');
    try {
      const paramsWithoutSources = {
        q: 'war OR conflict',
        pageSize: 10,
        sortBy: 'publishedAt',
        apiKey: NEWS_API_KEY
      };
      
      const response2 = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: paramsWithoutSources,
        timeout: 30000
      });
      
      console.log('✅ Success without sources!');
      console.log('Articles count:', response2.data.articles?.length || 0);
      
    } catch (error2) {
      console.error('❌ Also failed without sources:', error2.response?.status);
    }
  }
}

testExactCall(); 