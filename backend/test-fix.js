/**
 * Test the NewsAPI fix with correct page size
 */

require('dotenv').config();
const axios = require('axios');

const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const NEWS_API_KEY = process.env.NEWS_API_KEY;

async function testFixedCall() {
  try {
    console.log('=== Testing Fixed NewsAPI Call ===');
    
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
    
    const params = {
      q: query,
      pageSize: 100, // Fixed: NewsAPI free tier limit
      from: fromDate,
      sortBy: 'publishedAt',
      apiKey: NEWS_API_KEY
    };
    
    console.log('Testing with pageSize: 100');
    
    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params,
      timeout: 30000
    });
    
    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Articles count:', response.data.articles?.length || 0);
    
    if (response.data.articles && response.data.articles.length > 0) {
      console.log('First article:', response.data.articles[0].title);
    }
    
  } catch (error) {
    console.error('❌ Still failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testFixedCall(); 