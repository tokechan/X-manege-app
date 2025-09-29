/**
 * X-manage-app Cloudflare Workers API (Simplified for M0)
 * Basic API structure for testing
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Simple environment interface
interface Env {
  ENVIRONMENT?: string;
  [key: string]: unknown;
}

// Initialize Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://x-manage.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env?.ENVIRONMENT || 'development',
    version: '1.0.0',
    message: 'X-manage-app API is running'
  });
});

// API status endpoint
app.get('/status', async (c) => {
  return c.json({
    api: {
      status: 'operational',
      environment: c.env?.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
    },
    features: {
      authentication: 'not implemented',
      sync: 'not implemented',
      analytics: 'not implemented',
    }
  });
});

// Auth routes (placeholder)
app.get('/auth/me', async (c) => {
  return c.json({
    user: null,
    authenticated: false,
    message: 'Authentication not yet implemented'
  });
});

// Analytics routes (placeholder with mock data)
app.get('/analytics/dashboard', async (c) => {
  return c.json({
    overview: {
      totalPosts: 1234,
      totalImpressions: 567890,
      totalEngagement: 12345,
      engagementRate: 2.18,
    },
    message: 'Mock data - real analytics not yet implemented'
  });
});

// Posts routes (placeholder)
app.get('/posts', async (c) => {
  return c.json({
    posts: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
    message: 'Posts retrieval not yet implemented'
  });
});

// Sync routes (placeholder)
app.get('/sync/status', async (c) => {
  return c.json({
    lastSync: null,
    nextSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'not configured',
    message: 'Sync not yet implemented'
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }, 500);
});

// Export the worker
export default {
  fetch: app.fetch,
};
