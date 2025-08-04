/**
 * Environment Variable Loading Test
 * This script helps debug environment variable loading issues
 */

console.log('🧪 ENVIRONMENT VARIABLE LOADING TEST');
console.log('=====================================');

// Test 1: Check if dotenv is available
try {
  require('dotenv');
  console.log('✅ dotenv package is available');
} catch (error) {
  console.error('❌ dotenv package is not available:', error.message);
  process.exit(1);
}

// Test 2: Load environment variables
console.log('\n📁 Loading .env file...');
require('dotenv').config();

// Test 3: Check current directory and .env file
const fs = require('fs');
const path = require('path');

console.log('📂 Current working directory:', process.cwd());
console.log('📄 .env file path:', path.resolve('.env'));
console.log('📄 .env file exists:', fs.existsSync('.env'));

// Test 4: List all environment variables (masked)
console.log('\n🔑 Environment Variables:');
const envVars = {
  NODE_ENV: process.env.NODE_ENV || 'undefined',
  PORT: process.env.PORT || 'undefined',
  NEWS_API_KEY: process.env.NEWS_API_KEY ? '***SET***' : '***MISSING***',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***SET***' : '***MISSING***',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '***SET***' : '***MISSING***',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '***SET***' : '***MISSING***',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '***SET***' : '***MISSING***',
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || 'undefined',
  FORCE_TEST_DATA: process.env.FORCE_TEST_DATA || 'undefined'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Test 5: Validate critical variables
console.log('\n🔍 Critical Variable Validation:');
const criticalVars = ['OPENAI_API_KEY', 'NEWS_API_KEY', 'FIREBASE_PROJECT_ID'];
let allPresent = true;

criticalVars.forEach(varName => {
  const isPresent = !!process.env[varName];
  console.log(`  ${varName}: ${isPresent ? '✅ PRESENT' : '❌ MISSING'}`);
  if (!isPresent) allPresent = false;
});

if (allPresent) {
  console.log('\n✅ All critical environment variables are present!');
} else {
  console.log('\n❌ Some critical environment variables are missing!');
  console.log('💡 Please check your .env file and ensure all required variables are set.');
}

console.log('\n🧪 ENVIRONMENT VARIABLE LOADING TEST COMPLETE'); 