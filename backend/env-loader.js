/**
 * Bulletproof Environment Variable Loader
 * Ensures reliable loading of environment variables regardless of working directory
 */

const path = require('path');
const fs = require('fs');

/**
 * Load environment variables with multiple fallback strategies
 */
function loadEnvironmentVariables() {
  console.log('🔧 LOADING ENVIRONMENT VARIABLES...');
  
  // Strategy 1: Try explicit path relative to script directory
  const scriptDir = __dirname;
  const envPath = path.resolve(scriptDir, '.env');
  console.log('📁 Script directory:', scriptDir);
  console.log('📄 .env file path:', envPath);
  console.log('📄 .env file exists:', fs.existsSync(envPath));
  
  // Load with explicit path
  require('dotenv').config({ path: envPath });
  
  // Strategy 2: If still missing, try current working directory
  const cwd = process.cwd();
  const cwdEnvPath = path.resolve(cwd, '.env');
  const backendEnvPath = path.resolve(cwd, 'backend', '.env');
  
  console.log('📂 Current working directory:', cwd);
  console.log('📄 CWD .env exists:', fs.existsSync(cwdEnvPath));
  console.log('📄 backend/.env exists:', fs.existsSync(backendEnvPath));
  
  // If variables are still missing, try loading from other locations
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not found, trying alternative locations...');
    
    if (fs.existsSync(cwdEnvPath)) {
      console.log('📄 Loading from CWD .env');
      require('dotenv').config({ path: cwdEnvPath });
    }
    
    if (!process.env.OPENAI_API_KEY && fs.existsSync(backendEnvPath)) {
      console.log('📄 Loading from backend/.env');
      require('dotenv').config({ path: backendEnvPath });
    }
  }
  
  // Log final status
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
  
  console.log('🔑 Final Environment Variables Status:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  // Validate critical variables
  const criticalVars = ['OPENAI_API_KEY', 'NEWS_API_KEY', 'FIREBASE_PROJECT_ID'];
  const missingVars = criticalVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('💡 Please check your .env file and ensure all required variables are set.');
    console.error('📁 Expected .env location:', envPath);
    process.exit(1);
  }
  
  console.log('✅ All critical environment variables are present');
  console.log('🔧 ENVIRONMENT VARIABLE LOADING COMPLETE\n');
}

module.exports = { loadEnvironmentVariables }; 