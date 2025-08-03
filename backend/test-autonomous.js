/**
 * Test script for autonomous processing
 */

const axios = require('axios');

async function testAutonomousProcessing() {
  try {
    console.log('Testing autonomous processing...');
    
    const response = await axios.post('http://localhost:3001/autonomous-process');
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error testing autonomous processing:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAutonomousProcessing(); 