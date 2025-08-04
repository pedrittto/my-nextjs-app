/**
 * Test the bulletproof environment loader
 */

console.log('🧪 TESTING BULLETPROOF ENVIRONMENT LOADER');
console.log('==========================================');

// Test the bulletproof loader
const { loadEnvironmentVariables } = require('./env-loader');

try {
  loadEnvironmentVariables();
  console.log('✅ Bulletproof loader completed successfully');
  
  // Test if OpenAI key is available
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OPENAI_API_KEY is available');
    console.log('📏 Key length:', process.env.OPENAI_API_KEY.length);
    console.log('🔑 Key starts with:', process.env.OPENAI_API_KEY.substring(0, 7) + '...');
  } else {
    console.log('❌ OPENAI_API_KEY is still missing');
  }
} catch (error) {
  console.log('❌ Bulletproof loader failed:', error.message);
}

console.log('�� TEST COMPLETE'); 