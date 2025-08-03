/**
 * Test file for modelManager.js
 * Tests model detection and fallback functionality
 */

const { 
  testModelAvailability, 
  detectBestModel, 
  getActiveModel, 
  resetModelDetection,
  getModelStatus 
} = require('../modelManager');

// Mock OpenAI for testing
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

describe('Model Manager', () => {
  beforeEach(() => {
    resetModelDetection();
    jest.clearAllMocks();
  });

  describe('testModelAvailability', () => {
    it('should return true for available model', async () => {
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Hello' } }]
            })
          }
        }
      }));

      const result = await testModelAvailability('gpt-4o');
      expect(result).toBe(true);
    });

    it('should return false for unavailable model', async () => {
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('The model `gpt-4o-latest` does not exist'))
          }
        }
      }));

      const result = await testModelAvailability('gpt-4o-latest');
      expect(result).toBe(false);
    });
  });

  describe('detectBestModel', () => {
    it('should detect primary model when available', async () => {
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Hello' } }]
            })
          }
        }
      }));

      const model = await detectBestModel();
      expect(model).toBe('gpt-4o');
    });

    it('should fallback to gpt-3.5-turbo when primary is unavailable', async () => {
      const mockOpenAI = require('openai');
      const mockCreate = jest.fn()
        .mockRejectedValueOnce(new Error('The model `gpt-4o` does not exist'))
        .mockRejectedValueOnce(new Error('The model `gpt-4o-latest` does not exist'))
        .mockRejectedValueOnce(new Error('The model `gpt-4o-mini` does not exist'))
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Hello' } }]
        });

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      const model = await detectBestModel();
      expect(model).toBe('gpt-3.5-turbo');
    });
  });

  describe('getModelStatus', () => {
    it('should return correct status information', () => {
      const status = getModelStatus();
      expect(status).toHaveProperty('activeModel');
      expect(status).toHaveProperty('modelDetectionComplete');
      expect(status).toHaveProperty('primaryModel');
      expect(status).toHaveProperty('fallbackModel');
      expect(status).toHaveProperty('alternativeModels');
    });
  });
}); 