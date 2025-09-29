# X API Rate Limits & Data Sync Strategy

This document outlines the X API rate limits, our sync strategy, and implementation details for the daily data synchronization.

## 📊 X API v2 Rate Limits (2024)

### Tweet Lookup Endpoints
- **GET /2/tweets**: 300 requests per 15 minutes (App-only auth)
- **GET /2/tweets/:id**: 300 requests per 15 minutes (App-only auth)
- **GET /2/users/:id/tweets**: 1,500 requests per 15 minutes (App-only auth)

### User Lookup Endpoints
- **GET /2/users/me**: 75 requests per 15 minutes (OAuth 2.0)
- **GET /2/users/:id**: 300 requests per 15 minutes (App-only auth)

### Analytics Endpoints (Organic Metrics)
- **GET /2/tweets/:id/metrics**: 300 requests per 15 minutes (OAuth 2.0)
- **GET /2/users/:id/tweets** (with metrics): 1,500 requests per 15 minutes (OAuth 2.0)

### Search Endpoints
- **GET /2/tweets/search/recent**: 300 requests per 15 minutes (App-only auth)
- **GET /2/tweets/search/all**: 300 requests per 15 minutes (Academic Research)

## 🕐 Optimal Sync Window Analysis

### Why 02:30 UTC?

1. **Low Traffic Period**: Minimal user activity globally
2. **X API Stability**: Historically most stable during this window
3. **Rate Limit Reset**: Many rate limits reset at the top of the hour
4. **Global Timezone Consideration**: 
   - 10:30 PM EST (US East Coast)
   - 7:30 PM PST (US West Coast)
   - 11:30 AM JST (Japan)
   - 3:30 AM CET (Europe)

### Rate Limit Strategy

**Conservative Approach** (Recommended for production):
- Max 200 requests per 15-minute window (leaving 100 request buffer)
- 13.3 requests per minute maximum
- 1 request every 4.5 seconds

**Aggressive Approach** (For high-volume accounts):
- Max 280 requests per 15-minute window (leaving 20 request buffer)
- 18.7 requests per minute maximum
- 1 request every 3.2 seconds

## 🔄 Sync Implementation Strategy

### Phase 1: Initial Backfill (30-90 days)
```typescript
// Backfill strategy for new users
const backfillStrategy = {
  maxDays: 90,
  batchSize: 100, // tweets per request
  requestDelay: 4500, // ms between requests
  maxRequestsPerWindow: 200,
  windowDuration: 15 * 60 * 1000, // 15 minutes
};
```

### Phase 2: Daily Incremental Sync
```typescript
// Daily sync for existing users
const dailySyncStrategy = {
  maxTweets: 500, // per user per day
  batchSize: 100,
  requestDelay: 5000, // more conservative for daily sync
  maxRequestsPerWindow: 150,
  retryAttempts: 3,
  exponentialBackoff: true,
};
```

## 🛡️ Rate Limit Guard Rails

### 1. Request Rate Limiting
```typescript
class XAPIRateLimiter {
  private requestQueue: Array<() => Promise<any>> = [];
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly windowDuration = 15 * 60 * 1000; // 15 minutes
  private readonly maxRequests = 200; // Conservative limit

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.requestQueue.length === 0) return;

    // Reset window if needed
    const now = Date.now();
    if (now - this.windowStart >= this.windowDuration) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Check if we can make a request
    if (this.requestCount < this.maxRequests) {
      const request = this.requestQueue.shift();
      if (request) {
        this.requestCount++;
        await request();
        
        // Wait before processing next request
        setTimeout(() => this.processQueue(), 4500);
      }
    } else {
      // Wait until window resets
      const waitTime = this.windowDuration - (now - this.windowStart);
      setTimeout(() => this.processQueue(), waitTime);
    }
  }
}
```

### 2. Response Header Monitoring
```typescript
interface XAPIRateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

function parseRateLimitHeaders(response: Response): XAPIRateLimit {
  return {
    limit: parseInt(response.headers.get('x-rate-limit-limit') || '0'),
    remaining: parseInt(response.headers.get('x-rate-limit-remaining') || '0'),
    reset: parseInt(response.headers.get('x-rate-limit-reset') || '0'),
  };
}

function shouldBackoff(rateLimit: XAPIRateLimit): boolean {
  const remainingPercentage = rateLimit.remaining / rateLimit.limit;
  return remainingPercentage < 0.1; // Back off when less than 10% remaining
}
```

### 3. Exponential Backoff for 429 Errors
```typescript
async function makeRequestWithBackoff<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response;
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        // Rate limited - wait and retry
        const backoffTime = Math.min(1000 * Math.pow(2, attempt), 60000); // Max 1 minute
        console.log(`Rate limited. Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
      throw error;
    }
  }
}
```

## 📈 Monitoring & Alerting

### Key Metrics to Track
1. **Request Success Rate**: Should be > 99%
2. **Rate Limit Utilization**: Should stay < 80%
3. **Sync Completion Time**: Should complete within 30 minutes
4. **Error Rate**: Should be < 1%
5. **Data Freshness**: Last successful sync timestamp

### Alert Thresholds
```typescript
const alertThresholds = {
  rateLimitUtilization: 0.85, // Alert if using > 85% of rate limit
  errorRate: 0.05, // Alert if error rate > 5%
  syncDuration: 30 * 60 * 1000, // Alert if sync takes > 30 minutes
  dataFreshness: 25 * 60 * 60 * 1000, // Alert if data is > 25 hours old
};
```

## 🔧 Implementation Checklist

### Cloudflare Cron Trigger Setup
- [ ] Configure cron trigger for 02:30 UTC daily
- [ ] Set up proper error handling and retries
- [ ] Implement rate limiting middleware
- [ ] Add comprehensive logging

### Rate Limit Protection
- [ ] Implement request queue with rate limiting
- [ ] Add response header monitoring
- [ ] Set up exponential backoff for 429 errors
- [ ] Create circuit breaker for persistent failures

### Monitoring & Observability
- [ ] Set up Sentry error tracking
- [ ] Create custom metrics for rate limit usage
- [ ] Implement health checks
- [ ] Set up alerting for sync failures

### Testing
- [ ] Unit tests for rate limiting logic
- [ ] Integration tests with X API (using test credentials)
- [ ] Load testing to verify rate limit handling
- [ ] End-to-end sync testing

## 🚨 Emergency Procedures

### Rate Limit Exceeded
1. **Immediate**: Stop all API requests
2. **Assess**: Check rate limit reset time
3. **Wait**: Wait for rate limit window to reset
4. **Resume**: Resume with more conservative settings
5. **Monitor**: Increase monitoring frequency

### API Outage
1. **Detect**: Monitor for 5xx errors or timeouts
2. **Circuit Break**: Stop requests after 3 consecutive failures
3. **Backoff**: Wait with exponential backoff
4. **Retry**: Resume after backoff period
5. **Escalate**: Alert if outage persists > 1 hour

### Data Sync Failure
1. **Log**: Capture full error context
2. **Retry**: Attempt up to 3 retries with backoff
3. **Partial Success**: Save any successfully synced data
4. **Alert**: Notify if sync completely fails
5. **Manual**: Provide manual sync trigger option

## 📚 References

- [X API v2 Rate Limits Documentation](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Best Practices for API Rate Limiting](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
