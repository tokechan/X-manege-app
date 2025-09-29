/**
 * Environment Types for Cloudflare Workers
 */

export interface WorkerEnv {
  // Secrets
  X_BEARER_TOKEN?: string;
  X_API_KEY?: string;
  X_API_SECRET?: string;
  DATABASE_URL?: string;
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  SENTRY_API_DSN?: string;
  
  // Configuration
  MAX_REQUESTS_PER_WINDOW?: string;
  REQUEST_DELAY_MS?: string;
  SYNC_TIMEOUT_MINUTES?: string;
  ENVIRONMENT?: string;
  
  // Bindings
  CACHE?: KVNamespace;
  SYNC_STATE?: KVNamespace;
  ANALYTICS?: AnalyticsEngineDataset;
  
  // Make it compatible with Cloudflare Workers Bindings
  [key: string]: unknown;
}
