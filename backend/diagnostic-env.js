/**
 * Comprehensive Environment Variable Diagnostic Script
 * Tests all possible loading scenarios and provides detailed debugging information
 */

console.log('🔍 COMPREHENSIVE ENVIRONMENT DIAGNOSTIC');
console.log('========================================');

const fs = require('fs');
const path = require('path');

// Test 1: System Information
console.log('\n📊 SYSTEM INFORMATION:');
console.log('  Node.js version:', process.version);
console.log('  Platform:', process.platform);
console.log('  Architecture:', process.arch);
console.log('  Current working directory:', process.cwd());
console.log('  Script directory:', __dirname);

// Test 2: File System Check
console.log('\n📁 FILE SYSTEM CHECK:');
const possibleEnvPaths = [
  path.resolve(__dirname, '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', 'backend', '.env')
];

possibleEnvPaths.forEach((envPath, index) => {
  const exists = fs.existsSync(envPath);
  const size = exists ? fs.statSync(envPath).size : 0;
  console.log(`  ${index + 1}. ${envPath}`);
  console.log(`     Exists: ${exists ? '✅' : '❌'}`);
  console.log(`     Size: ${size} bytes`);
});

// Test 3: dotenv Package Check
console.log('\n📦 DOTENV PACKAGE CHECK:');
try {
  const dotenv = require('dotenv');
  console.log('  ✅ dotenv package is available');
  console.log('  Version:', require('dotenv/package.json').version);
} catch (error) {
  console.log('  ❌ dotenv package is not available:', error.message);
}

// Test 4: Environment Variable Loading Test
console.log('\n🔧 ENVIRONMENT LOADING TEST:');

// Clear any existing environment variables (for testing)
const originalEnv = { ...process.env };

// Test loading from different locations
const testLocations = [
  { name: 'Script directory', path: path.resolve(__dirname, '.env') },
  { name: 'Current working directory', path: path.resolve(process.cwd(), '.env') },
  { name: 'backend/.env from root', path: path.resolve(process.cwd(), 'backend', '.env') }
];

testLocations.forEach((location, index) => {
  console.log(`\n  Test ${index + 1}: ${location.name}`);
  console.log(`  Path: ${location.path}`);
  console.log(`  Exists: ${fs.existsSync(location.path) ? '✅' : '❌'}`);
  
  if (fs.existsSync(location.path)) {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Try to load
    try {
      require('dotenv').config({ path: location.path });
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      console.log(`  OPENAI_API_KEY loaded: ${hasOpenAI ? '✅' : '❌'}`);
      
      if (hasOpenAI) {
        console.log(`  Key length: ${process.env.OPENAI_API_KEY.length} characters`);
        console.log(`  Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
      }
    } catch (error) {
      console.log(`  ❌ Error loading: ${error.message}`);
    }
  }
});

// Test 5: Final Status Check
console.log('\n🔍 FINAL STATUS CHECK:');
const finalEnvVars = {
  NODE_ENV: process.env.NODE_ENV || 'undefined',
  PORT: process.env.PORT || 'undefined',
  NEWS_API_KEY: process.env.NEWS_API_KEY ? '***SET***' : '***MISSING***',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***SET***' : '***MISSING***',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '***SET***' : '***MISSING***',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '***SET***' : '***MISSING***',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '***SET***' : '***MISSING***'
};

Object.entries(finalEnvVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// Test 6: Recommendations
console.log('\n💡 RECOMMENDATIONS:');

if (!process.env.OPENAI_API_KEY) {
  console.log('  ❌ OPENAI_API_KEY is missing!');
  console.log('  🔧 Solutions:');
  console.log('    1. Ensure .env file exists in backend directory');
  console.log('    2. Check file permissions and encoding');
  console.log('    3. Verify no spaces around = sign');
  console.log('    4. Restart Node.js process completely');
  console.log('    5. Use the bulletproof env-loader.js');
} else {
  console.log('  ✅ OPENAI_API_KEY is present!');
  console.log('  🎉 Environment variables are loading correctly');
}

console.log('\n🔍 DIAGNOSTIC COMPLETE'); 