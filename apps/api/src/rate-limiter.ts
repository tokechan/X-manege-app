/**
 * X API Rate Limiter
 * Implements rate limiting for X API requests with proper guard rails
 */

export interface XAPIRateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

export interface RateLimiterConfig {
  maxRequestsPerWindow: number;
  windowDurationMs: number;
  requestDelayMs: number;
  maxRetries: number;
}

export class XAPIRateLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private requestCount = 0;
  private windowStart = Date.now();
  private isProcessing = false;
  
  constructor(private config: RateLimiterConfig) {}

  /**
   * Make a rate-limited request to X API
   */
  async makeRequest<T>(requestFn: () => Promise<Response>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const response = await this.makeRequestWithBackoff(requestFn);
          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      // Reset window if needed
      const now = Date.now();
      if (now - this.windowStart >= this.config.windowDurationMs) {
        this.requestCount = 0;
        this.windowStart = now;
        console.log('Rate limit window reset');
      }

      // Check if we can make a request
      if (this.requestCount < this.config.maxRequestsPerWindow) {
        const request = this.requestQueue.shift();
        if (request) {
          this.requestCount++;
          console.log(`Making request ${this.requestCount}/${this.config.maxRequestsPerWindow}`);
          
          try {
            await request();
          } catch (error) {
            console.error('Request failed:', error);
          }
          
          // Wait before processing next request
          if (this.requestQueue.length > 0) {
            await this.delay(this.config.requestDelayMs);
          }
        }
      } else {
        // Wait until window resets
        const waitTime = this.config.windowDurationMs - (now - this.windowStart);
        console.log(`Rate limit reached. Waiting ${waitTime}ms for window reset`);
        await this.delay(waitTime);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Make request with exponential backoff for 429 errors
   */
  private async makeRequestWithBackoff(
    requestFn: () => Promise<Response>,
    attempt = 0
  ): Promise<Response> {
    try {
      const response = await requestFn();
      
      // Parse rate limit headers
      const rateLimit = this.parseRateLimitHeaders(response);
      this.logRateLimitStatus(rateLimit);
      
      // Check if we should back off
      if (this.shouldBackoff(rateLimit)) {
        console.warn('Approaching rate limit, backing off...');
        await this.delay(this.config.requestDelayMs * 2);
      }
      
      if (response.status === 429) {
        throw new Error('Rate limited');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (attempt < this.config.maxRetries && this.isRetryableError(error)) {
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 60000); // Max 1 minute
        console.log(`Request failed (attempt ${attempt + 1}). Retrying in ${backoffTime}ms...`);
        await this.delay(backoffTime);
        return this.makeRequestWithBackoff(requestFn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Parse rate limit headers from X API response
   */
  private parseRateLimitHeaders(response: Response): XAPIRateLimit {
    return {
      limit: parseInt(response.headers.get('x-rate-limit-limit') || '0'),
      remaining: parseInt(response.headers.get('x-rate-limit-remaining') || '0'),
      reset: parseInt(response.headers.get('x-rate-limit-reset') || '0'),
    };
  }

  /**
   * Check if we should back off based on remaining rate limit
   */
  private shouldBackoff(rateLimit: XAPIRateLimit): boolean {
    if (rateLimit.limit === 0) return false;
    const remainingPercentage = rateLimit.remaining / rateLimit.limit;
    return remainingPercentage < 0.15; // Back off when less than 15% remaining
  }

  /**
   * Log current rate limit status
   */
  private logRateLimitStatus(rateLimit: XAPIRateLimit): void {
    if (rateLimit.limit > 0) {
      const resetTime = new Date(rateLimit.reset * 1000).toISOString();
      console.log(`Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining, resets at ${resetTime}`);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error.message?.includes('Rate limited')) return true;
    if (error.message?.includes('HTTP 5')) return true; // 5xx errors
    if (error.message?.includes('timeout')) return true;
    return false;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      queueLength: this.requestQueue.length,
      requestCount: this.requestCount,
      maxRequests: this.config.maxRequestsPerWindow,
      windowStart: this.windowStart,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear the request queue (emergency stop)
   */
  clearQueue(): void {
    this.requestQueue = [];
    this.isProcessing = false;
    console.log('Request queue cleared');
  }
}

/**
 * Default rate limiter configuration for X API
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimiterConfig = {
  maxRequestsPerWindow: 200, // Conservative limit (X API allows 300)
  windowDurationMs: 15 * 60 * 1000, // 15 minutes
  requestDelayMs: 4500, // 4.5 seconds between requests
  maxRetries: 3,
};

/**
 * Create a rate limiter instance with environment-specific config
 */
export function createRateLimiter(env?: any): XAPIRateLimiter {
  const config: RateLimiterConfig = {
    maxRequestsPerWindow: parseInt(env?.MAX_REQUESTS_PER_WINDOW) || DEFAULT_RATE_LIMIT_CONFIG.maxRequestsPerWindow,
    windowDurationMs: DEFAULT_RATE_LIMIT_CONFIG.windowDurationMs,
    requestDelayMs: parseInt(env?.REQUEST_DELAY_MS) || DEFAULT_RATE_LIMIT_CONFIG.requestDelayMs,
    maxRetries: DEFAULT_RATE_LIMIT_CONFIG.maxRetries,
  };

  return new XAPIRateLimiter(config);
}
