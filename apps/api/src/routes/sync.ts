/**
 * Sync Routes
 * Handles data synchronization operations
 */

import { Hono } from 'hono';
import type { WorkerEnv } from '../types/env';

export const syncRoutes = new Hono<{ Bindings: WorkerEnv }>();

// Get sync status
syncRoutes.get('/status', async (c) => {
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

// Manual sync trigger (development only)
syncRoutes.post('/trigger', async (c) => {
  const env = c.env;
  
  if (env.ENVIRONMENT === 'production') {
    return c.json({ error: 'Manual sync not allowed in production' }, 403);
  }
  
  console.log('Manual sync triggered');
  
  // Run sync in background
  c.executionCtx.waitUntil(
    // Import and call sync function
    import('../cron-handlers').then(({ handleDailyXSync }) => handleDailyXSync(env))
  );
  
  return c.json({
    message: 'Sync triggered successfully',
    timestamp: new Date().toISOString(),
  });
});

// Get sync history for a specific account
syncRoutes.get('/history/:accountId', async (c) => {
  const accountId = c.req.param('accountId');
  
  // TODO: Implement sync history retrieval
  return c.json({
    accountId,
    history: [],
    message: 'Sync history not yet implemented'
  });
});

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
