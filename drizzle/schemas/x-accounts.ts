/**
 * X (Twitter) Accounts Schema
 * Tables for managing connected X accounts and tokens
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth';

// Connected X accounts
export const xAccounts = sqliteTable('x_accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // X account information
  xUserId: text('x_user_id').notNull().unique(), // X's internal user ID
  username: text('username').notNull(), // @username
  displayName: text('display_name').notNull(),
  profileImageUrl: text('profile_image_url'),
  verified: integer('verified', { mode: 'boolean' }).default(false),
  
  // Account metrics (updated periodically)
  followersCount: integer('followers_count').default(0),
  followingCount: integer('following_count').default(0),
  tweetCount: integer('tweet_count').default(0),
  listedCount: integer('listed_count').default(0),
  
  // Account status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index('x_accounts_user_id_idx').on(table.userId),
  usernameIdx: index('x_accounts_username_idx').on(table.username),
  lastSyncIdx: index('x_accounts_last_sync_idx').on(table.lastSyncAt),
}));

// X OAuth tokens
export const xTokens = sqliteTable('x_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  xAccountId: text('x_account_id').notNull().references(() => xAccounts.id, { onDelete: 'cascade' }).unique(),
  
  // OAuth 2.0 tokens
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenType: text('token_type').default('Bearer'),
  scope: text('scope'),
  
  // Token metadata
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  issuedAt: integer('issued_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  
  // Status
  isValid: integer('is_valid', { mode: 'boolean' }).default(true),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  xAccountIdIdx: index('x_tokens_x_account_id_idx').on(table.xAccountId),
  expiresAtIdx: index('x_tokens_expires_at_idx').on(table.expiresAt),
}));

// X account sync history
export const xAccountSyncHistory = sqliteTable('x_account_sync_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  xAccountId: text('x_account_id').notNull().references(() => xAccounts.id, { onDelete: 'cascade' }),
  
  // Sync details
  syncType: text('sync_type').notNull(), // 'full' | 'incremental' | 'backfill'
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  
  // Sync metrics
  postsProcessed: integer('posts_processed').default(0),
  postsAdded: integer('posts_added').default(0),
  postsUpdated: integer('posts_updated').default(0),
  metricsUpdated: integer('metrics_updated').default(0),
  
  // API usage
  apiRequestsUsed: integer('api_requests_used').default(0),
  rateLimitHits: integer('rate_limit_hits').default(0),
  
  // Timing
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  
  // Error handling
  errorMessage: text('error_message'),
  errorCode: text('error_code'),
  retryCount: integer('retry_count').default(0),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  xAccountIdIdx: index('x_account_sync_history_x_account_id_idx').on(table.xAccountId),
  statusIdx: index('x_account_sync_history_status_idx').on(table.status),
  startedAtIdx: index('x_account_sync_history_started_at_idx').on(table.startedAt),
}));

// Types for TypeScript
export type XAccount = typeof xAccounts.$inferSelect;
export type NewXAccount = typeof xAccounts.$inferInsert;
export type XToken = typeof xTokens.$inferSelect;
export type NewXToken = typeof xTokens.$inferInsert;
export type XAccountSyncHistory = typeof xAccountSyncHistory.$inferSelect;
export type NewXAccountSyncHistory = typeof xAccountSyncHistory.$inferInsert;
