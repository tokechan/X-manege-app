/**
 * Cron Job Handlers for X-manage-app
 * Handles scheduled tasks including daily X data sync
 */

import { createRateLimiter } from './rate-limiter';

export interface CronEnvironment {
  // Secrets
  X_BEARER_TOKEN: string;
  X_API_KEY: string;
  X_API_SECRET: string;
  DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SENTRY_API_DSN: string;
  
  // Configuration
  MAX_REQUESTS_PER_WINDOW: string;
  REQUEST_DELAY_MS: string;
  SYNC_TIMEOUT_MINUTES: string;
  ENVIRONMENT: string;
  
  // Bindings
  CACHE: KVNamespace;
  SYNC_STATE: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
}

/**
 * Daily X Data Sync Handler
 * Runs at 02:30 UTC daily to sync user posts and metrics
 */
export async function handleDailyXSync(env: CronEnvironment): Promise<void> {
  const startTime = Date.now();
  const syncId = `sync-${Date.now()}`;
  
  console.log(`Starting daily X sync: ${syncId}`);
  
  try {
    // Initialize rate limiter
    const rateLimiter = createRateLimiter(env);
    
    // Get list of connected X accounts
    const connectedAccounts = await getConnectedXAccounts(env);
    console.log(`Found ${connectedAccounts.length} connected X accounts`);
    
    if (connectedAccounts.length === 0) {
      console.log('No connected X accounts found, skipping sync');
      return;
    }
    
    // Track sync progress
    const syncProgress = {
      totalAccounts: connectedAccounts.length,
      processedAccounts: 0,
      successfulAccounts: 0,
      failedAccounts: 0,
      totalTweets: 0,
      errors: [] as string[],
    };
    
    // Process each account
    for (const account of connectedAccounts) {
      try {
        console.log(`Syncing account: ${account.username} (${account.id})`);
        
        const accountResult = await syncAccountData(account, rateLimiter, env);
        
        syncProgress.processedAccounts++;
        syncProgress.successfulAccounts++;
        syncProgress.totalTweets += accountResult.tweetsProcessed;
        
        console.log(`Account ${account.username} synced successfully: ${accountResult.tweetsProcessed} tweets`);
        
      } catch (error) {
        syncProgress.processedAccounts++;
        syncProgress.failedAccounts++;
        syncProgress.errors.push(`${account.username}: ${error.message}`);
        
        console.error(`Failed to sync account ${account.username}:`, error);
        
        // Continue with other accounts even if one fails
        continue;
      }
    }
    
    // Save sync results
    const syncResult = {
      id: syncId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      ...syncProgress,
    };
    
    await saveSyncResult(syncResult, env);
    
    // Send analytics
    env.ANALYTICS.writeDataPoint({
      blobs: [syncId, env.ENVIRONMENT],
      doubles: [syncProgress.totalTweets, syncResult.duration],
      indexes: [syncProgress.successfulAccounts],
    });
    
    console.log(`Daily sync completed: ${syncProgress.successfulAccounts}/${syncProgress.totalAccounts} accounts successful`);
    
    // Alert if too many failures
    if (syncProgress.failedAccounts > syncProgress.totalAccounts * 0.2) {
      await sendSyncAlert('High failure rate in daily sync', syncResult, env);
    }
    
  } catch (error) {
    console.error('Daily sync failed:', error);
    
    const errorResult = {
      id: syncId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error.message,
      totalAccounts: 0,
      processedAccounts: 0,
      successfulAccounts: 0,
      failedAccounts: 0,
      totalTweets: 0,
      errors: [error.message],
    };
    
    await saveSyncResult(errorResult, env);
    await sendSyncAlert('Daily sync completely failed', errorResult, env);
    
    throw error;
  }
}

/**
 * Health Check Handler
 * Runs every 6 hours to verify system health
 */
export async function handleHealthCheck(env: CronEnvironment): Promise<void> {
  console.log('Running health check...');
  
  const healthChecks = {
    database: false,
    xApi: false,
    cache: false,
    lastSync: false,
  };
  
  try {
    // Check database connectivity
    healthChecks.database = await checkDatabaseHealth(env);
    
    // Check X API connectivity
    healthChecks.xApi = await checkXAPIHealth(env);
    
    // Check cache/KV availability
    healthChecks.cache = await checkCacheHealth(env);
    
    // Check last sync status
    healthChecks.lastSync = await checkLastSyncHealth(env);
    
    const allHealthy = Object.values(healthChecks).every(check => check);
    
    console.log('Health check results:', healthChecks);
    
    if (!allHealthy) {
      await sendHealthAlert('Health check failed', healthChecks, env);
    }
    
    // Store health check result
    await env.CACHE.put('health-check', JSON.stringify({
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      healthy: allHealthy,
    }), { expirationTtl: 6 * 60 * 60 }); // 6 hours
    
  } catch (error) {
    console.error('Health check failed:', error);
    await sendHealthAlert('Health check error', { error: error.message }, env);
  }
}

/**
 * Monthly Cleanup Handler
 * Runs on the 1st of each month to clean up old data
 */
export async function handleMonthlyCleanup(env: CronEnvironment): Promise<void> {
  console.log('Running monthly cleanup...');
  
  try {
    // Clean up old sync results (keep last 90 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    // Clean up old cache entries
    // Note: KV doesn't have bulk delete, so we'll rely on TTL
    
    // Clean up old analytics data (if applicable)
    // This would depend on your database schema
    
    console.log('Monthly cleanup completed');
    
  } catch (error) {
    console.error('Monthly cleanup failed:', error);
  }
}

/**
 * Get list of connected X accounts from database
 */
async function getConnectedXAccounts(env: CronEnvironment): Promise<Array<{id: string, username: string, userId: string}>> {
  // This would query your database for connected X accounts
  // Placeholder implementation
  return [
    { id: 'x_account_1', username: 'example_user', userId: 'user_1' }
  ];
}

/**
 * Sync data for a single X account
 */
async function syncAccountData(
  account: {id: string, username: string, userId: string},
  rateLimiter: any,
  env: CronEnvironment
): Promise<{tweetsProcessed: number}> {
  // Get user's recent tweets
  const tweets = await rateLimiter.makeRequest(async () => {
    return fetch(`https://api.twitter.com/2/users/${account.id}/tweets?max_results=100&tweet.fields=created_at,public_metrics,context_annotations`, {
      headers: {
        'Authorization': `Bearer ${env.X_BEARER_TOKEN}`,
        'User-Agent': 'X-manage-app/1.0',
      },
    });
  });
  
  // Process and store tweets
  let tweetsProcessed = 0;
  if (tweets.data) {
    for (const tweet of tweets.data) {
      // Store tweet data in database
      // This would use your database client
      tweetsProcessed++;
    }
  }
  
  return { tweetsProcessed };
}

/**
 * Save sync result to storage
 */
async function saveSyncResult(result: any, env: CronEnvironment): Promise<void> {
  const key = `sync-result-${result.id}`;
  await env.SYNC_STATE.put(key, JSON.stringify(result), {
    expirationTtl: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Send sync alert via Sentry or other monitoring
 */
async function sendSyncAlert(message: string, data: any, env: CronEnvironment): Promise<void> {
  console.error(`ALERT: ${message}`, data);
  
  // In a real implementation, you would send this to Sentry
  // or another monitoring service
}

/**
 * Send health alert
 */
async function sendHealthAlert(message: string, data: any, env: CronEnvironment): Promise<void> {
  console.error(`HEALTH ALERT: ${message}`, data);
}

/**
 * Check database health
 */
async function checkDatabaseHealth(env: CronEnvironment): Promise<boolean> {
  try {
    // Simple database connectivity check
    // This would use your database client
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Check X API health
 */
async function checkXAPIHealth(env: CronEnvironment): Promise<boolean> {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${env.X_BEARER_TOKEN}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('X API health check failed:', error);
    return false;
  }
}

/**
 * Check cache health
 */
async function checkCacheHealth(env: CronEnvironment): Promise<boolean> {
  try {
    const testKey = 'health-check-test';
    const testValue = Date.now().toString();
    
    await env.CACHE.put(testKey, testValue, { expirationTtl: 60 });
    const retrieved = await env.CACHE.get(testKey);
    
    return retrieved === testValue;
  } catch (error) {
    console.error('Cache health check failed:', error);
    return false;
  }
}

/**
 * Check last sync health
 */
async function checkLastSyncHealth(env: CronEnvironment): Promise<boolean> {
  try {
    // Check if last sync was within acceptable timeframe (25 hours)
    const lastSyncKey = 'last-successful-sync';
    const lastSyncData = await env.SYNC_STATE.get(lastSyncKey);
    
    if (!lastSyncData) {
      return false; // No previous sync found
    }
    
    const lastSync = JSON.parse(lastSyncData);
    const lastSyncTime = new Date(lastSync.timestamp).getTime();
    const now = Date.now();
    const hoursSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60);
    
    return hoursSinceLastSync < 25; // Alert if more than 25 hours
  } catch (error) {
    console.error('Last sync health check failed:', error);
    return false;
  }
}
