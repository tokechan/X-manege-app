/**
 * Sync Jobs Schema
 * Tables for tracking data synchronization jobs and system operations
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth';
import { xAccounts } from './x-accounts';

// Global sync jobs (system-wide operations)
export const syncJobs = sqliteTable('sync_jobs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Job identification
  jobType: text('job_type').notNull(), // 'daily_sync' | 'backfill' | 'health_check' | 'cleanup'
  jobName: text('job_name').notNull(),
  
  // Job status
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: integer('priority').default(5), // 1-10, higher = more priority
  
  // Scheduling
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  
  // Progress tracking
  totalSteps: integer('total_steps').default(0),
  completedSteps: integer('completed_steps').default(0),
  progressPercentage: real('progress_percentage').default(0),
  
  // Resource usage
  apiRequestsUsed: integer('api_requests_used').default(0),
  rateLimitHits: integer('rate_limit_hits').default(0),
  memoryUsageMb: real('memory_usage_mb'),
  cpuTimeMs: integer('cpu_time_ms'),
  
  // Results
  recordsProcessed: integer('records_processed').default(0),
  recordsCreated: integer('records_created').default(0),
  recordsUpdated: integer('records_updated').default(0),
  recordsDeleted: integer('records_deleted').default(0),
  
  // Error handling
  errorMessage: text('error_message'),
  errorCode: text('error_code'),
  errorStack: text('error_stack'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  
  // Configuration
  config: text('config'), // JSON configuration for the job
  
  // Metadata
  triggeredBy: text('triggered_by'), // 'cron' | 'manual' | 'webhook' | 'system'
  environment: text('environment').default('production'),
  version: text('version').default('1.0'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  jobTypeIdx: index('sync_jobs_job_type_idx').on(table.jobType),
  statusIdx: index('sync_jobs_status_idx').on(table.status),
  scheduledAtIdx: index('sync_jobs_scheduled_at_idx').on(table.scheduledAt),
  startedAtIdx: index('sync_jobs_started_at_idx').on(table.startedAt),
  priorityIdx: index('sync_jobs_priority_idx').on(table.priority),
}));

// User-specific sync jobs
export const userSyncJobs = sqliteTable('user_sync_jobs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  xAccountId: text('x_account_id').references(() => xAccounts.id, { onDelete: 'cascade' }),
  
  // Job identification
  jobType: text('job_type').notNull(), // 'initial_backfill' | 'incremental_sync' | 'full_refresh'
  jobName: text('job_name').notNull(),
  
  // Job status
  status: text('status').notNull(),
  priority: integer('priority').default(5),
  
  // Scheduling
  scheduledAt: integer('scheduled_at', { mode: 'timestamp' }),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  
  // Sync window configuration
  syncFromDate: integer('sync_from_date', { mode: 'timestamp' }),
  syncToDate: integer('sync_to_date', { mode: 'timestamp' }),
  backfillDays: integer('backfill_days'),
  
  // Progress tracking
  totalPosts: integer('total_posts').default(0),
  processedPosts: integer('processed_posts').default(0),
  newPosts: integer('new_posts').default(0),
  updatedPosts: integer('updated_posts').default(0),
  metricsUpdated: integer('metrics_updated').default(0),
  
  // API usage
  apiRequestsUsed: integer('api_requests_used').default(0),
  rateLimitHits: integer('rate_limit_hits').default(0),
  requestsPerMinute: real('requests_per_minute'),
  
  // Performance metrics
  postsPerSecond: real('posts_per_second'),
  averageResponseTime: real('average_response_time'),
  
  // Error handling
  errorMessage: text('error_message'),
  errorCode: text('error_code'),
  retryCount: integer('retry_count').default(0),
  
  // Configuration
  config: text('config'), // JSON configuration
  
  // Metadata
  triggeredBy: text('triggered_by'),
  parentJobId: text('parent_job_id').references(() => syncJobs.id),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('user_sync_jobs_user_id_idx').on(table.userId),
  xAccountIdIdx: index('user_sync_jobs_x_account_id_idx').on(table.xAccountId),
  jobTypeIdx: index('user_sync_jobs_job_type_idx').on(table.jobType),
  statusIdx: index('user_sync_jobs_status_idx').on(table.status),
  scheduledAtIdx: index('user_sync_jobs_scheduled_at_idx').on(table.scheduledAt),
  parentJobIdIdx: index('user_sync_jobs_parent_job_id_idx').on(table.parentJobId),
}));

// System health and monitoring
export const systemHealth = sqliteTable('system_health', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Health check details
  checkType: text('check_type').notNull(), // 'database' | 'api' | 'cache' | 'overall'
  status: text('status').notNull(), // 'healthy' | 'degraded' | 'unhealthy'
  
  // Metrics
  responseTime: real('response_time'), // milliseconds
  uptime: real('uptime'), // percentage
  errorRate: real('error_rate'), // percentage
  
  // Resource usage
  memoryUsage: real('memory_usage'), // percentage
  cpuUsage: real('cpu_usage'), // percentage
  diskUsage: real('disk_usage'), // percentage
  
  // API health
  apiRequestsPerMinute: real('api_requests_per_minute'),
  apiSuccessRate: real('api_success_rate'),
  rateLimitUtilization: real('rate_limit_utilization'),
  
  // Database health
  connectionCount: integer('connection_count'),
  queryResponseTime: real('query_response_time'),
  
  // Details and context
  details: text('details'), // JSON with additional health information
  alerts: text('alerts'), // JSON array of active alerts
  
  // Metadata
  checkedAt: integer('checked_at', { mode: 'timestamp' }).notNull(),
  environment: text('environment').default('production'),
  version: text('version').default('1.0'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  checkTypeIdx: index('system_health_check_type_idx').on(table.checkType),
  statusIdx: index('system_health_status_idx').on(table.status),
  checkedAtIdx: index('system_health_checked_at_idx').on(table.checkedAt),
}));

// Rate limit tracking
export const rateLimitTracking = sqliteTable('rate_limit_tracking', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Rate limit context
  endpoint: text('endpoint').notNull(), // X API endpoint
  windowStart: integer('window_start', { mode: 'timestamp' }).notNull(),
  windowEnd: integer('window_end', { mode: 'timestamp' }).notNull(),
  
  // Usage metrics
  requestsUsed: integer('requests_used').default(0),
  requestsLimit: integer('requests_limit').notNull(),
  utilizationPercentage: real('utilization_percentage').default(0),
  
  // Timing
  firstRequestAt: integer('first_request_at', { mode: 'timestamp' }),
  lastRequestAt: integer('last_request_at', { mode: 'timestamp' }),
  
  // Performance
  averageResponseTime: real('average_response_time'),
  successRate: real('success_rate'),
  
  // Alerts
  limitExceeded: integer('limit_exceeded', { mode: 'boolean' }).default(false),
  alertsSent: integer('alerts_sent').default(0),
  
  // Metadata
  environment: text('environment').default('production'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  endpointIdx: index('rate_limit_tracking_endpoint_idx').on(table.endpoint),
  windowStartIdx: index('rate_limit_tracking_window_start_idx').on(table.windowStart),
  utilizationIdx: index('rate_limit_tracking_utilization_idx').on(table.utilizationPercentage),
}));

// Types for TypeScript
export type SyncJob = typeof syncJobs.$inferSelect;
export type NewSyncJob = typeof syncJobs.$inferInsert;
export type UserSyncJob = typeof userSyncJobs.$inferSelect;
export type NewUserSyncJob = typeof userSyncJobs.$inferInsert;
export type SystemHealth = typeof systemHealth.$inferSelect;
export type NewSystemHealth = typeof systemHealth.$inferInsert;
export type RateLimitTracking = typeof rateLimitTracking.$inferSelect;
export type NewRateLimitTracking = typeof rateLimitTracking.$inferInsert;
