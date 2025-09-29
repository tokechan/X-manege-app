/**
 * X-manage-app Cloudflare Workers API
 * Main entry point for the API with cron trigger support
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';
import { handleDailyXSync, handleHealthCheck, handleMonthlyCleanup } from './cron-handlers';
import { authRoutes } from './routes/auth';
import { syncRoutes } from './routes/sync';
import { postsRoutes } from './routes/posts';
import { analyticsRoutes } from './routes/analytics';
import type { WorkerEnv } from './types/env';

// Initialize Hono app
const app = new Hono<{ Bindings: WorkerEnv }>();

// Middleware
app.use('*', logger());
app.use('*', timing());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://x-manage.app', 'https://staging.x-manage.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// API Routes
app.route('/auth', authRoutes);
app.route('/sync', syncRoutes);
app.route('/posts', postsRoutes);
app.route('/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', async (c) => {
  const env = c.env;
  
  // Get cached health check result
  let healthData = null;
  if (env.CACHE) {
    const cachedHealth = await env.CACHE.get('health-check');
    healthData = cachedHealth ? JSON.parse(cachedHealth) : null;
  }
  
  // Test database connection
  let dbHealth = false;
  try {
    const { createDatabaseClient, checkDatabaseHealth } = await import('./lib/database');
    const db = createDatabaseClient(env as any);
    dbHealth = await checkDatabaseHealth(db);
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  
  return c.json({
    status: dbHealth ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT || 'development',
    version: '1.0.0',
    checks: {
      database: dbHealth,
      cache: !!env.CACHE,
    },
    lastHealthCheck: healthData,
  });
});

// API status endpoint
app.get('/status', async (c) => {
  const env = c.env;
  
  // Get last sync result
  const syncKeys = await env.SYNC_STATE.list({ prefix: 'sync-result-' });
  const lastSyncKey = syncKeys.keys.sort((a, b) => b.name.localeCompare(a.name))[0];
  
  let lastSync = null;
  if (lastSyncKey) {
    const syncData = await env.SYNC_STATE.get(lastSyncKey.name);
    lastSync = syncData ? JSON.parse(syncData) : null;
  }
  
  return c.json({
    api: {
      status: 'operational',
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
    },
    sync: {
      lastSync: lastSync,
      nextSync: getNextSyncTime(),
    },
    rateLimit: {
      maxRequestsPerWindow: env.MAX_REQUESTS_PER_WINDOW,
      windowDurationMinutes: 15,
      requestDelayMs: env.REQUEST_DELAY_MS,
    },
  });
});

// Manual sync trigger (for testing/emergency)
app.post('/sync/trigger', async (c) => {
  const env = c.env;
  
  try {
    // Only allow manual trigger in development or with proper auth
    if (env.ENVIRONMENT === 'production') {
      // In production, you'd want proper authentication here
      return c.json({ error: 'Manual sync not allowed in production' }, 403);
    }
    
    console.log('Manual sync triggered');
    
    // Run sync in background (don't wait for completion)
    c.executionCtx.waitUntil(handleDailyXSync(env));
    
    return c.json({
      message: 'Sync triggered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Manual sync trigger failed:', error);
    return c.json({ error: 'Failed to trigger sync' }, 500);
  }
});

// Sync status endpoint
app.get('/sync/status', async (c) => {
  const env = c.env;
  
  // Get recent sync results
  const syncKeys = await env.SYNC_STATE.list({ prefix: 'sync-result-', limit: 10 });
  const syncResults = [];
  
  for (const key of syncKeys.keys) {
    const syncData = await env.SYNC_STATE.get(key.name);
    if (syncData) {
      syncResults.push(JSON.parse(syncData));
    }
  }
  
  // Sort by timestamp (newest first)
  syncResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return c.json({
    recentSyncs: syncResults,
    nextSync: getNextSyncTime(),
    syncWindow: '02:30 UTC daily',
  });
});

// Rate limit status endpoint
app.get('/rate-limit/status', async (c) => {
  const env = c.env;
  
  // Get rate limit status from cache
  const rateLimitStatus = await env.CACHE.get('rate-limit-status');
  const status = rateLimitStatus ? JSON.parse(rateLimitStatus) : null;
  
  return c.json({
    current: status,
    config: {
      maxRequestsPerWindow: env.MAX_REQUESTS_PER_WINDOW,
      windowDurationMinutes: 15,
      requestDelayMs: env.REQUEST_DELAY_MS,
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

/**
 * Calculate next sync time (02:30 UTC daily)
 */
function getNextSyncTime(): string {
  const now = new Date();
  const nextSync = new Date(now);
  
  // Set to 02:30 UTC
  nextSync.setUTCHours(2, 30, 0, 0);
  
  // If we've already passed today's sync time, move to tomorrow
  if (nextSync <= now) {
    nextSync.setUTCDate(nextSync.getUTCDate() + 1);
  }
  
  return nextSync.toISOString();
}

/**
 * Scheduled event handler for cron triggers
 */
async function handleScheduled(event: ScheduledEvent, env: WorkerEnv, ctx: ExecutionContext): Promise<void> {
  console.log(`Cron trigger: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`);
  
  try {
    switch (event.cron) {
      case '30 2 * * *': // Daily at 02:30 UTC
        console.log('Running daily X sync...');
        await handleDailyXSync(env);
        
        // Update last successful sync timestamp
        await env.SYNC_STATE.put('last-successful-sync', JSON.stringify({
          timestamp: new Date().toISOString(),
          cron: event.cron,
        }), { expirationTtl: 7 * 24 * 60 * 60 }); // 7 days
        break;
        
      case '0 */6 * * *': // Every 6 hours
        console.log('Running health check...');
        await handleHealthCheck(env);
        break;
        
      case '0 0 1 * *': // Monthly on 1st day
        console.log('Running monthly cleanup...');
        await handleMonthlyCleanup(env);
        break;
        
      default:
        console.warn(`Unknown cron trigger: ${event.cron}`);
    }
  } catch (error) {
    console.error(`Cron job failed (${event.cron}):`, error);
    
    // Send error to Sentry or monitoring service
    // In a real implementation, you'd integrate with Sentry here
    
    throw error; // Re-throw to mark the cron job as failed
  }
}

// Export the worker
export default {
  fetch: app.fetch,
  scheduled: handleScheduled,
};
