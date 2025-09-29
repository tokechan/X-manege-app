/**
 * Authentication Schema
 * Tables for user authentication using Better Auth
 */

import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Users table - core user information
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name'),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Accounts table - OAuth provider connections
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'oauth' | 'email'
  provider: text('provider').notNull(), // 'google' | 'email'
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  // Composite primary key for provider + providerAccountId
  providerKey: primaryKey({
    columns: [table.provider, table.providerAccountId],
  }),
}));

// Sessions table - user sessions
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Verification tokens table - for email verification
export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  // Composite primary key for identifier + token
  tokenKey: primaryKey({
    columns: [table.identifier, table.token],
  }),
}));

// User preferences table
export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  timezone: text('timezone').default('UTC'),
  dateFormat: text('date_format').default('YYYY-MM-DD'),
  theme: text('theme').default('system'), // 'light' | 'dark' | 'system'
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).default(true),
  syncFrequency: text('sync_frequency').default('daily'), // 'hourly' | 'daily' | 'weekly'
  dataRetentionDays: integer('data_retention_days').default(365),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
