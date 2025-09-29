/**
 * Main Drizzle Schema
 * Exports all tables and types for the X-manage-app database
 */

// Export all tables from individual schema files
export * from './schemas/auth';
export * from './schemas/x-accounts';
export * from './schemas/x-posts';
export * from './schemas/sync-jobs';

// Re-export commonly used tables for convenience
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  userPreferences,
} from './schemas/auth';

import {
  xAccounts,
  xTokens,
  xAccountSyncHistory,
} from './schemas/x-accounts';

import {
  xPosts,
  xPostMetrics,
  xPostPerformanceSummary,
  xPostInsights,
} from './schemas/x-posts';

import {
  syncJobs,
  userSyncJobs,
  systemHealth,
  rateLimitTracking,
} from './schemas/sync-jobs';

// Grouped exports for easier imports
export const authTables = {
  users,
  accounts,
  sessions,
  verificationTokens,
  userPreferences,
};

export const xAccountTables = {
  xAccounts,
  xTokens,
  xAccountSyncHistory,
};

export const xPostTables = {
  xPosts,
  xPostMetrics,
  xPostPerformanceSummary,
  xPostInsights,
};

export const syncTables = {
  syncJobs,
  userSyncJobs,
  systemHealth,
  rateLimitTracking,
};

// All tables for migrations and utilities
export const allTables = {
  ...authTables,
  ...xAccountTables,
  ...xPostTables,
  ...syncTables,
};

// Database relations (for Drizzle queries)
import { relations } from 'drizzle-orm';

// User relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  preferences: one(userPreferences),
  xAccounts: many(xAccounts),
  userSyncJobs: many(userSyncJobs),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

// X Account relations
export const xAccountsRelations = relations(xAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [xAccounts.userId],
    references: [users.id],
  }),
  tokens: one(xTokens),
  posts: many(xPosts),
  syncHistory: many(xAccountSyncHistory),
  userSyncJobs: many(userSyncJobs),
}));

export const xTokensRelations = relations(xTokens, ({ one }) => ({
  xAccount: one(xAccounts, {
    fields: [xTokens.xAccountId],
    references: [xAccounts.id],
  }),
}));

export const xAccountSyncHistoryRelations = relations(xAccountSyncHistory, ({ one }) => ({
  xAccount: one(xAccounts, {
    fields: [xAccountSyncHistory.xAccountId],
    references: [xAccounts.id],
  }),
}));

// X Post relations
export const xPostsRelations = relations(xPosts, ({ one, many }) => ({
  xAccount: one(xAccounts, {
    fields: [xPosts.xAccountId],
    references: [xAccounts.id],
  }),
  metrics: many(xPostMetrics),
  performanceSummary: one(xPostPerformanceSummary),
  insights: one(xPostInsights),
}));

export const xPostMetricsRelations = relations(xPostMetrics, ({ one }) => ({
  xPost: one(xPosts, {
    fields: [xPostMetrics.xPostId],
    references: [xPosts.id],
  }),
}));

export const xPostPerformanceSummaryRelations = relations(xPostPerformanceSummary, ({ one }) => ({
  xPost: one(xPosts, {
    fields: [xPostPerformanceSummary.xPostId],
    references: [xPosts.id],
  }),
}));

export const xPostInsightsRelations = relations(xPostInsights, ({ one }) => ({
  xPost: one(xPosts, {
    fields: [xPostInsights.xPostId],
    references: [xPosts.id],
  }),
}));

// Sync Job relations
export const syncJobsRelations = relations(syncJobs, ({ many }) => ({
  userSyncJobs: many(userSyncJobs),
}));

export const userSyncJobsRelations = relations(userSyncJobs, ({ one }) => ({
  user: one(users, {
    fields: [userSyncJobs.userId],
    references: [users.id],
  }),
  xAccount: one(xAccounts, {
    fields: [userSyncJobs.xAccountId],
    references: [xAccounts.id],
  }),
  parentJob: one(syncJobs, {
    fields: [userSyncJobs.parentJobId],
    references: [syncJobs.id],
  }),
}));

// Database configuration types
export interface DatabaseConfig {
  url: string;
  authToken?: string;
  syncUrl?: string;
}

// Common query types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface PostFilters extends DateRangeFilter {
  postType?: string;
  hasMedia?: boolean;
  hasLinks?: boolean;
  minImpressions?: number;
  minEngagement?: number;
}

export interface MetricsFilters extends DateRangeFilter {
  minAge?: number; // hours
  maxAge?: number; // hours
  dataSource?: string;
}

// Utility types for common operations
export type PostWithMetrics = XPost & {
  latestMetrics?: XPostMetrics;
  performanceSummary?: XPostPerformanceSummary;
  insights?: XPostInsights;
};

export type AccountWithStats = XAccount & {
  postCount?: number;
  totalImpressions?: number;
  totalEngagement?: number;
  lastSyncJob?: UserSyncJob;
};

export type UserWithAccounts = User & {
  xAccounts?: XAccount[];
  preferences?: UserPreferences;
};
