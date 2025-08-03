/**
 * Simple logger module for console logging
 * Can be extended later to support file logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

class Logger {
  constructor() {
    this.level = LOG_LEVELS[currentLogLevel] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  error(message, data = null) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  warn(message, data = null) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  info(message, data = null) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  debug(message, data = null) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  // Convenience methods for specific operations
  logFetchNews(count) {
    this.info(`Fetched ${count} news articles from NewsAPI`);
  }

  logTrendingAnalysis(trends) {
    this.info(`Analyzed trends: ${trends.length} topics found`, { trends });
  }

  logTrendSelection(selectedTrend) {
    this.info(`Selected trending topic: ${selectedTrend}`);
  }

  logSummaryGeneration(trend) {
    this.info(`Generating summary for trend: ${trend}`);
  }

  logFirestoreWrite(documentId) {
    this.info(`Added document to Firestore: ${documentId}`);
  }

  logError(operation, error) {
    this.error(`Error in ${operation}:`, { 
      message: error.message, 
      stack: error.stack 
    });
  }
}

module.exports = new Logger(); 