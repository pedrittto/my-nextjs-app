# News Generation Backend

A modern Node.js backend that migrates the n8n workflow for automated news generation. The system fetches news articles, analyzes trends, generates summaries using OpenAI, and stores results in Firestore.

## Features

- **News Fetching**: Fetches articles from NewsAPI (easily extensible for Twitter, RSS, etc.)
- **Trend Analysis**: Analyzes articles to find trending topics with intelligent filtering
- **AI Summarization**: Uses OpenAI GPT-4 with automatic fallback to GPT-3.5-turbo for summaries, credibility scores, and translations
- **Duplicate Detection**: Prevents duplicate articles from being generated
- **Firestore Integration**: Stores generated articles in Firebase Firestore
- **Scheduled Execution**: Runs automatically every 2 hours via cron job
- **REST API**: Manual trigger endpoint for on-demand generation
- **Comprehensive Logging**: Detailed logging at every step
- **Unit Tests**: Test coverage for core modules

## Architecture

The backend is split into modular components:

```
backend/
├── index.js          # Main entry point and Express server
├── fetchNews.js      # News fetching from various sources
├── trending.js       # Trend analysis and topic selection
├── summarizer.js     # OpenAI integration for summaries
├── modelManager.js   # OpenAI model detection and fallback logic
├── firestore.js      # Firestore database operations
├── logger.js         # Logging utilities
├── test/             # Unit tests
│   ├── fetchNews.test.js
│   ├── trending.test.js
│   └── modelManager.test.js
└── env.example       # Environment variables template
```

## Prerequisites

- Node.js 18+ 
- NewsAPI account and API key
- OpenAI API key
- Firebase project with Firestore enabled
- Firebase service account credentials

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp backend/env.example backend/.env
   ```
   
   Edit `backend/.env` with your API keys:
   ```env
   # NewsAPI Configuration
   NEWS_API_KEY=your_news_api_key_here
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Cron Schedule (every 2 hours by default)
   CRON_SCHEDULE="0 */2 * * *"
   ```

3. **Set up Firebase**:
   - Create a Firebase project
   - Enable Firestore
   - Create a service account and download the JSON key
   - Extract the required fields to your `.env` file

## Usage

### Development Mode

```bash
npm run backend:dev
```

### Production Mode

```bash
npm run backend
```

### Manual Trigger

Send a POST request to trigger news generation:

```bash
curl -X POST http://localhost:3001/generate
```

### Health Check

```bash
curl http://localhost:3001/health
```

### Configuration Status

```bash
curl http://localhost:3001/status
```

### Model Detection

```bash
curl -X POST http://localhost:3001/detect-model
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | Configuration status |
| `/generate` | POST | Manually trigger news generation |
| `/detect-model` | POST | Manually trigger model detection |

## Workflow

The system follows this workflow:

1. **Fetch Articles**: Retrieves news articles from NewsAPI using predefined keywords
2. **Analyze Trends**: Extracts trending topics from articles using word frequency analysis
3. **Select Topic**: Chooses the best trending topic based on thresholds and novelty
4. **Fetch Details**: Gets detailed articles for the selected trend
5. **Generate Summary**: Uses OpenAI to create summaries, translations, and credibility scores
6. **Check Duplicates**: Verifies the article isn't a duplicate
7. **Store Results**: Saves the generated article to Firestore

## OpenAI Model Management

The system includes intelligent model detection and fallback capabilities:

### Automatic Model Detection

The system automatically detects which OpenAI models are available to your API key:

1. **Primary Model**: `gpt-4o` (preferred)
2. **Alternative Models**: `gpt-4o-latest`, `gpt-4o-mini` (if primary is unavailable)
3. **Fallback Model**: `gpt-3.5-turbo` (if no GPT-4 models are available)

### How It Works

- On first use, the system tests model availability with a simple API call
- If the primary model fails (404, access denied), it automatically tries alternatives
- If all GPT-4 models fail, it falls back to `gpt-3.5-turbo`
- The selected model is cached for subsequent requests
- Model information is logged for debugging purposes

### Model Status

Check which model is currently active:

```bash
curl http://localhost:3001/status
```

Response includes model information:
```json
{
  "configured": true,
  "config": { ... },
  "model": {
    "activeModel": "gpt-4o",
    "modelDetectionComplete": true,
    "primaryModel": "gpt-4o",
    "fallbackModel": "gpt-3.5-turbo",
    "alternativeModels": ["gpt-4o-latest", "gpt-4o-mini"]
  }
}
```

### Manual Model Detection

Force re-detection of available models:

```bash
curl -X POST http://localhost:3001/detect-model
```

This is useful when:
- You've upgraded your OpenAI plan
- You want to test with different models
- Troubleshooting model access issues

## Configuration

The default schedule runs every 2 hours. You can customize it using cron syntax:

```env
CRON_SCHEDULE="0 */2 * * *"  # Every 2 hours
CRON_SCHEDULE="0 */6 * * *"  # Every 6 hours
CRON_SCHEDULE="0 9 * * *"    # Daily at 9 AM
```

### Logging

Set the log level using the `LOG_LEVEL` environment variable:

```env
LOG_LEVEL=DEBUG  # Most verbose
LOG_LEVEL=INFO   # Default
LOG_LEVEL=WARN   # Warnings and errors only
LOG_LEVEL=ERROR  # Errors only
```

## Testing

Run the unit tests:

```bash
npm test
```

### Validation Testing Mode

The system is currently in **testing mode** with relaxed validation rules:

- **Title length**: Maximum 100 characters (increased from 60)
- **Description length**: Minimum 20 characters (reduced from 600), maximum 1200 characters
- **Enhanced logging**: All validation failures are logged with detailed information

This allows shorter summaries to be accepted for testing purposes. To revert to production settings, see the comments in `summarizer.js`.

Run specific test files:

```bash
node --test backend/test/fetchNews.test.js
node --test backend/test/trending.test.js
node --test backend/test/modelManager.test.js
node --test backend/test/validation.test.js
```

## Extending the System

### Adding New News Sources

To add a new news source (e.g., Twitter, RSS), modify `fetchNews.js`:

```javascript
// In fetchNews function
switch (source.toLowerCase()) {
  case 'newsapi':
    // existing code
    break;
  
  case 'twitter':
    articles = await fetchFromTwitter(options);
    break;
  
  case 'rss':
    articles = await fetchFromRSS(options);
    break;
}
```

### Customizing Trend Analysis

Modify `trending.js` to adjust:
- Topic keywords (`TOPIC_KEYWORDS`)
- Hot topics (`HOT_TOPICS`)
- Thresholds (`MIN_COUNT`, `HOT_TOPIC_COUNT`)

### Adjusting AI Prompts

Edit the prompt in `summarizer.js` to modify:
- Summary generation rules
- Credibility scoring criteria
- Language requirements

## Error Handling

The system includes comprehensive error handling:
- API rate limiting and retries
- Network timeout handling
- Invalid data validation
- Graceful degradation when services are unavailable

## Monitoring

Monitor the system using:
- Application logs (console output)
- Health check endpoint
- Configuration status endpoint
- Firestore document creation timestamps

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**:
   - Verify service account credentials
   - Check project ID and permissions

2. **OpenAI API Error**:
   - Verify API key is valid
   - Check rate limits and quotas

3. **NewsAPI Error**:
   - Verify API key
   - Check daily request limits

4. **No Articles Generated**:
   - Check if trending topics meet thresholds
   - Verify news sources are available
   - Review duplicate detection logic

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=DEBUG
```

## License

This project is part of the news generation system. See the main project license for details. 