/**
 * Test file for validation changes
 * Tests the relaxed validation rules for testing purposes
 */

const { validateSummary } = require('../summarizer');

describe('Summary Validation (Testing Mode)', () => {
  describe('Valid summaries', () => {
    it('should accept short descriptions (20+ chars)', () => {
      const validSummary = {
        title_pl: 'Test title',
        description_pl: 'This is a short description with exactly 20 characters.',
        title_en: 'Test title',
        description_en: 'This is a short description with exactly 20 characters.',
        credibility_score: 75,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(validSummary)).toBe(true);
    });

    it('should accept longer titles (up to 100 chars)', () => {
      const validSummary = {
        title_pl: 'A'.repeat(100),
        description_pl: 'This is a valid description with more than 20 characters to pass validation.',
        title_en: 'A'.repeat(100),
        description_en: 'This is a valid description with more than 20 characters to pass validation.',
        credibility_score: 80,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(validSummary)).toBe(true);
    });

    it('should accept normal length descriptions', () => {
      const validSummary = {
        title_pl: 'Normal title',
        description_pl: 'This is a normal length description that should pass validation without any issues.',
        title_en: 'Normal title',
        description_en: 'This is a normal length description that should pass validation without any issues.',
        credibility_score: 90,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(validSummary)).toBe(true);
    });
  });

  describe('Invalid summaries', () => {
    it('should reject very short descriptions (< 20 chars)', () => {
      const invalidSummary = {
        title_pl: 'Test title',
        description_pl: 'Too short',
        title_en: 'Test title',
        description_en: 'Too short',
        credibility_score: 75,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(invalidSummary)).toBe(false);
    });

    it('should reject very long titles (> 100 chars)', () => {
      const invalidSummary = {
        title_pl: 'A'.repeat(101),
        description_pl: 'This is a valid description with more than 20 characters.',
        title_en: 'A'.repeat(101),
        description_en: 'This is a valid description with more than 20 characters.',
        credibility_score: 75,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(invalidSummary)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidSummary = {
        title_pl: 'Test title',
        description_pl: 'Valid description',
        title_en: 'Test title',
        // Missing description_en
        credibility_score: 75,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(invalidSummary)).toBe(false);
    });

    it('should reject invalid credibility scores', () => {
      const invalidSummary = {
        title_pl: 'Test title',
        description_pl: 'Valid description',
        title_en: 'Test title',
        description_en: 'Valid description',
        credibility_score: 150, // Invalid: > 100
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(invalidSummary)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined summary data', () => {
      expect(validateSummary(null)).toBe(false);
      expect(validateSummary(undefined)).toBe(false);
    });

    it('should handle empty strings', () => {
      const invalidSummary = {
        title_pl: '',
        description_pl: '',
        title_en: '',
        description_en: '',
        credibility_score: 75,
        published_at: '2024-01-01T00:00:00Z'
      };

      expect(validateSummary(invalidSummary)).toBe(false);
    });
  });
}); 