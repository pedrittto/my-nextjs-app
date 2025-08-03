/**
 * Summarizer module using OpenAI GPT
 * Generates summaries, credibility scores, and translations
 * 
 * PRODUCTION MODE: Length requirements for high-quality descriptions:
 * - Title max length: 100 characters
 * - Description min length: 600 characters (enhanced for rich content)
 * - Description max length: 1200 characters
 * 
 * The system now prioritizes longer, more comprehensive descriptions
 * that fuse facts across all input articles rather than simple summaries.
 */

const logger = require('./logger');
const { createCompletion } = require('./modelManager');

/**
 * Generate summary and credibility score using OpenAI
 * @param {Array} articles - Array of articles to summarize
 * @param {string} trend - The trending topic
 * @param {string} imageUrl - Image URL for the article
 * @returns {Promise<Object>} - Generated summary data
 */
async function generateSummary(articles, trend, imageUrl = '') {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    logger.logSummaryGeneration(trend);

    // Prepare articles data for the prompt
    const articlesData = articles.map(article => ({
      title: article.title,
      description: article.description,
      source: article.source,
      publishedAt: article.publishedAt,
      url: article.url
    }));

    const prompt = `Here is the articles array you receive:
${JSON.stringify(articlesData)}:

**Your task is to generate ONE and ONLY ONE JSON object, following STRICTLY the structure below, and using ONLY the information provided in the articles. DO NOT invent, guess, translate, or use any knowledge beyond the input. DO NOT use general knowledge, search the web, or paraphrase context.**

**CRITICAL RULES – read CAREFULLY:**
- Your main goal is to maximize trust and reliability. You must be extremely strict and logical in credibility scoring and all content fields.

**1. Topic selection:**
- Select ONLY ONE main topic from the input articles (the topic with the most unique sources or the highest frequency).
- Ignore all topics NOT related to war or politics (NO sports, entertainment, etc.).
- If there is no topic related to war or politics, return nothing.

**2. Title and description fields:**
- Output both "pl" and "en" versions:  
    - "title_pl", "description_pl" must be in POLISH only.  
    - "title_en", "description_en" must be in ENGLISH only.  
    - NEVER output any text in another language.  
    - If a field would be in another language, return an empty string ("").
    - Use only information from the input articles, do not translate or invent facts.
- **TITLE RULES:**  
    - The title must NOT resemble a summary heading or a list of issues separated by commas.  
    - It should be a natural, concise, and catchy news headline that lets the user understand the main point without reading the description.  
    - Do NOT use structures like: "Topic X, Topic Y: ...". Do NOT summarize or list topics in the title.
- **DESCRIPTION RULES:**  
    - The description must NOT mention any source names, phrases like "according to...", "as reported by...", "this article describes...", or similar wording.  
    - The description should NOT summarize the articles or refer to their structure.  
    - Instead, provide a synthesized, merged account – an intersection/average of all key facts found across ALL input articles about the selected topic.  
    - Only write what is consistently confirmed in all or the majority of the articles.  
    - This is NOT a summary — it is a fusion of all facts that overlap between sources, with no reference to the process or sources.
    - **LENGTH REQUIREMENT**: Descriptions must be between 600-1200 characters. If you cannot reach 600 characters with overlapping facts, include all consistent information available, but never invent or add unrelated details.
    - **CONTENT QUALITY**: Focus on creating natural, cohesive narratives that weave together all relevant facts from multiple sources. Avoid simplistic summaries and instead create rich, detailed accounts that reflect the complexity of the situation.

**3. Deduplication:**
- You must ensure that this news card is NOT a duplicate of any previous card in the database or list.  
    - If the main topic, title, or summary matches any existing card, or if the articles are identical, DO NOT generate a new card (return nothing).

**4. Credibility score (0-100):**
- Score must be based ONLY on:
    - (a) The number of unique sources (more = higher score).
    - (b) **Include ALL available sources, even less trusted or extreme ones.** Your goal is to capture every perspective and seek the truth in the middle. **Do NOT filter out less reliable or "extreme" sources, but rate them lower in credibility.** Favor higher scores if the majority of sources are trusted/mainstream, but include all voices in the analysis.
    - (c) The recency of articles (prefer more recent = higher score).
    - (d) The consistency of facts and overlap in details between articles (more overlap = higher score).
    - (e) The style and objectivity of articles (if articles are sensationalist, clickbait, or use emotional language, reduce score).
    - (f) ONLY assign a score of 100% if there are at least 5 unique, trusted, mainstream sources AND the facts overlap in nearly every key detail.
- Do NOT be afraid to assign 100% IF the criteria above are met.
- Do NOT assign 100% if there is any single untrusted/unknown/biased source **that creates doubt about the core facts**.
- If all sources are old (>48h) or not trusted, assign a much lower score.

**5. Image selection:**
- You MUST select exactly one image relevant to the chosen topic from the provided articles.
- The image should be FREE OF OBVIOUS WATERMARKS OR LOGOS from stock photo services (e.g., NO Getty, Shutterstock, etc.).
- News source logos (BBC, CNN, Reuters, AP) are acceptable if the image is otherwise relevant.
- Do NOT select images that contain excessive visible text, watermarks, or copyright marks.
- Prefer neutral, illustrative, or subject-relevant images.
- If NO suitable image is found in the articles, set image_url to an empty string "".
- NEVER invent or use generic/AI-generated images.
- ALWAYS try to find a valid image from the provided articles before giving up.

**6. Published date:**
- Use ISO 8601 date of the most recent article on the chosen topic.

**7. Structure:**
Return the result as a plain JSON object, NO comments, NO explanation, NO extra fields, NO extra text.  
Return nothing if any field cannot be filled according to the above rules.

---
{
  "title_pl": "...",        // POLISH ONLY, max 100 chars, no clickbait, no other language, catchy/natural headline (not a summary/list)
  "description_pl": "...",  // POLISH ONLY, 600-1200 chars, rich fusion of all articles, no source names, no summary structure, natural narrative
  "title_en": "...",        // ENGLISH ONLY, max 100 chars, same as above
  "description_en": "...",  // ENGLISH ONLY, 600-1200 chars, rich fusion of all articles, no source names, no summary structure, natural narrative
  "credibility_score": ..., // Integer 0-100, see above scoring rules
  "published_at": "...",    // ISO 8601 date of most recent article for topic
  "image_url": "..."        // URL of relevant, NO-watermark image, see above rules
}
---

**RULES:**
- Use ONLY facts, names, and numbers from the articles provided.
- If you cannot generate a value from the input, use an empty string "" (do not guess).
- NEVER invent, translate, or return any field in a language other than Polish or English.
- NEVER use or output any image with visible watermark or source logo/text.
- NEVER generate a card if topic/title/description duplicates any earlier news card.
- ONLY create news related to war or politics.
- If you break any rule, the result is INVALID.

---

**Generate your answer ONLY based on the provided articles. DO NOT use general knowledge. If you cannot generate a field – leave it as an empty string (""). Return only the JSON object.**`;

    const completion = await createCompletion({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let summaryData;
    try {
      summaryData = JSON.parse(response);
    } catch (parseError) {
      logger.error('Failed to parse OpenAI response as JSON', { response, error: parseError.message });
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate the response structure
    const requiredFields = ['title_pl', 'description_pl', 'title_en', 'description_en', 'credibility_score', 'published_at'];
    const missingFields = requiredFields.filter(field => !summaryData[field]);
    
    // Log image URL for debugging
    logger.info('Generated summary image URL:', { 
      image_url: summaryData.image_url,
      has_image: !!summaryData.image_url 
    });
    
    if (missingFields.length > 0) {
      logger.warn('Missing required fields in OpenAI response', { missingFields, summaryData });
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Use provided image URL if available and no image was selected
    if (!summaryData.image_url && imageUrl) {
      summaryData.image_url = imageUrl;
    }

    logger.info('Successfully generated summary', {
      title_en: summaryData.title_en,
      credibility_score: summaryData.credibility_score
    });

    return summaryData;
  } catch (error) {
    logger.logError('generateSummary', error);
    throw error;
  }
}

/**
 * Validate summary data
 * @param {Object} summaryData - The summary data to validate
 * @returns {boolean} - True if valid
 */
function validateSummary(summaryData) {
  try {
    if (!summaryData) {
      logger.warn('Summary data is null or undefined');
      return false;
    }

    const validationErrors = [];
    const requiredFields = ['title_pl', 'description_pl', 'title_en', 'description_en', 'credibility_score', 'published_at'];
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!summaryData[field]) {
        validationErrors.push(`Missing required field: ${field}`);
      }
    }

    // Validate credibility score
    const score = parseInt(summaryData.credibility_score);
    if (isNaN(score) || score < 0 || score > 100) {
      validationErrors.push(`Invalid credibility score: ${summaryData.credibility_score} (must be 0-100)`);
    }

    // Validate title lengths
    if (summaryData.title_en && summaryData.title_en.length > 100) {
      validationErrors.push(`Title EN too long: ${summaryData.title_en.length} chars (max 100)`);
    }
    if (summaryData.title_pl && summaryData.title_pl.length > 100) {
      validationErrors.push(`Title PL too long: ${summaryData.title_pl.length} chars (max 100)`);
    }

    // Validate description lengths
    if (summaryData.description_en) {
      if (summaryData.description_en.length < 600) {
        validationErrors.push(`Description EN too short: ${summaryData.description_en.length} chars (min 600)`);
      }
      if (summaryData.description_en.length > 1200) {
        validationErrors.push(`Description EN too long: ${summaryData.description_en.length} chars (max 1200)`);
      }
    }
    if (summaryData.description_pl) {
      if (summaryData.description_pl.length < 600) {
        validationErrors.push(`Description PL too short: ${summaryData.description_pl.length} chars (min 600)`);
      }
      if (summaryData.description_pl.length > 1200) {
        validationErrors.push(`Description PL too long: ${summaryData.description_pl.length} chars (max 1200)`);
      }
    }

    // Log all validation errors if any
    if (validationErrors.length > 0) {
      logger.warn('Summary validation failed', {
        errors: validationErrors,
        summaryData: {
          title_en: summaryData.title_en?.substring(0, 50) + '...',
          title_pl: summaryData.title_pl?.substring(0, 50) + '...',
          description_en_length: summaryData.description_en?.length,
          description_pl_length: summaryData.description_pl?.length,
          credibility_score: summaryData.credibility_score,
          published_at: summaryData.published_at
        }
      });
      return false;
    }

    logger.info('Summary validation passed', {
      title_en_length: summaryData.title_en?.length,
      title_pl_length: summaryData.title_pl?.length,
      description_en_length: summaryData.description_en?.length,
      description_pl_length: summaryData.description_pl?.length,
      credibility_score: summaryData.credibility_score
    });

    return true;
  } catch (error) {
    logger.logError('validateSummary', error);
    return false;
  }
}

module.exports = {
  generateSummary,
  validateSummary
}; 