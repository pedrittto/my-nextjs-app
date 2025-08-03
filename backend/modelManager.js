/**
 * OpenAI Model Manager
 * Handles model detection, fallback logic, and model availability checking
 */

const OpenAI = require('openai');
const logger = require('./logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const MODELS = {
  PRIMARY: 'gpt-4o',
  FALLBACK: 'gpt-3.5-turbo',
  ALTERNATIVES: ['gpt-4o-latest', 'gpt-4o-mini']
};

let activeModel = null;
let modelDetectionComplete = false;

/**
 * Test if a model is available by making a simple API call
 * @param {string} model - The model to test
 * @returns {Promise<boolean>} - True if model is available
 */
async function testModelAvailability(model) {
  try {
    logger.info(`Testing model availability: ${model}`);
    
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ],
      max_tokens: 5,
      temperature: 0
    });

    if (response.choices && response.choices[0]) {
      logger.info(`Model ${model} is available`);
      return true;
    }
    
    return false;
  } catch (error) {
    const errorMessage = error.message || '';
    const isModelError = errorMessage.includes('does not exist') || 
                        errorMessage.includes('not have access') ||
                        errorMessage.includes('404') ||
                        errorMessage.includes('model_not_found');
    
    if (isModelError) {
      logger.warn(`Model ${model} is not available: ${errorMessage}`);
      return false;
    } else {
      // Other errors (like API key issues) should be logged but not treated as model unavailability
      logger.error(`Error testing model ${model}: ${errorMessage}`);
      return false;
    }
  }
}

/**
 * Detect the best available model
 * @returns {Promise<string>} - The best available model
 */
async function detectBestModel() {
  if (modelDetectionComplete && activeModel) {
    return activeModel;
  }

  logger.info('Starting model detection...');

  // Try primary model first
  if (await testModelAvailability(MODELS.PRIMARY)) {
    activeModel = MODELS.PRIMARY;
    logger.info(`Using primary model: ${activeModel}`);
    modelDetectionComplete = true;
    return activeModel;
  }

  // Try alternative names for the same model
  for (const alternative of MODELS.ALTERNATIVES) {
    if (await testModelAvailability(alternative)) {
      activeModel = alternative;
      logger.info(`Using alternative model: ${activeModel}`);
      modelDetectionComplete = true;
      return activeModel;
    }
  }

  // Fallback to gpt-3.5-turbo
  if (await testModelAvailability(MODELS.FALLBACK)) {
    activeModel = MODELS.FALLBACK;
    logger.info(`Using fallback model: ${activeModel}`);
    modelDetectionComplete = true;
    return activeModel;
  }

  // If no models are available, throw an error
  throw new Error('No OpenAI models are available. Please check your API key and model access.');
}

/**
 * Get the currently active model
 * @returns {string|null} - The active model or null if not detected
 */
function getActiveModel() {
  return activeModel;
}

/**
 * Reset model detection (useful for testing or when API key changes)
 */
function resetModelDetection() {
  activeModel = null;
  modelDetectionComplete = false;
  logger.info('Model detection reset');
}

/**
 * Create a completion with automatic model fallback
 * @param {Object} options - OpenAI completion options
 * @returns {Promise<Object>} - OpenAI completion response
 */
async function createCompletion(options) {
  const model = await detectBestModel();
  
  logger.info(`Creating completion with model: ${model}`);
  
  const completionOptions = {
    ...options,
    model: model
  };

  try {
    const response = await openai.chat.completions.create(completionOptions);
    logger.info(`Completion successful with model: ${model}`);
    return response;
  } catch (error) {
    logger.error(`Completion failed with model ${model}: ${error.message}`);
    
    // If the error is model-related and we're not already using the fallback
    if (model !== MODELS.FALLBACK && 
        (error.message.includes('does not exist') || 
         error.message.includes('not have access') ||
         error.message.includes('404') ||
         error.message.includes('model_not_found'))) {
      
      logger.info('Attempting fallback to gpt-3.5-turbo...');
      resetModelDetection();
      
      // Retry with fallback model
      const fallbackModel = await detectBestModel();
      const fallbackOptions = {
        ...options,
        model: fallbackModel
      };
      
      const fallbackResponse = await openai.chat.completions.create(fallbackOptions);
      logger.info(`Completion successful with fallback model: ${fallbackModel}`);
      return fallbackResponse;
    }
    
    throw error;
  }
}

/**
 * Get model status information
 * @returns {Object} - Model status information
 */
function getModelStatus() {
  return {
    activeModel: activeModel,
    modelDetectionComplete: modelDetectionComplete,
    primaryModel: MODELS.PRIMARY,
    fallbackModel: MODELS.FALLBACK,
    alternativeModels: MODELS.ALTERNATIVES
  };
}

module.exports = {
  detectBestModel,
  getActiveModel,
  resetModelDetection,
  createCompletion,
  getModelStatus,
  testModelAvailability
}; 