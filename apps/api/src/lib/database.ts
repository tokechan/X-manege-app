/**
 * Database Connection for Cloudflare Workers
 * Provides database client for API routes
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
// Note: In a real implementation, this would import from the shared drizzle package
// For now, we'll create a minimal schema for testing
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Minimal schema for testing
const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

const xAccounts = sqliteTable('x_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  username: text('username').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

const xPosts = sqliteTable('x_posts', {
  id: text('id').primaryKey(),
  xAccountId: text('x_account_id').notNull(),
  text: text('text').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

const syncJobs = sqliteTable('sync_jobs', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
});

const schema = { users, xAccounts, xPosts, syncJobs };

export type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create database client for Cloudflare Workers environment
 */
export function createDatabaseClient(env: {
  DATABASE_URL?: string;
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  ENVIRONMENT?: string;
}): DatabaseClient {
  const {
    DATABASE_URL,
    TURSO_DATABASE_URL,
    TURSO_AUTH_TOKEN,
    ENVIRONMENT = 'development',
  } = env;

  // Use Turso for production/staging, local SQLite for development
  if (ENVIRONMENT === 'production' || ENVIRONMENT === 'staging') {
    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for production/staging');
    }
    
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    return drizzle(client, { schema });
  } else {
    // Development environment
    const url = DATABASE_URL || 'file:local.db';
    const client = createClient({ url });
    return drizzle(client, { schema });
  }
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(db: DatabaseClient): Promise<boolean> {
  try {
    // Simple query to test connection
    await db.select().from(schema.users).limit(1);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(db: DatabaseClient): Promise<{
  userCount: number;
  xAccountCount: number;
  postCount: number;
  syncJobCount: number;
}> {
  try {
    const [users, xAccounts, posts, syncJobs] = await Promise.all([
      db.select().from(schema.users),
      db.select().from(schema.xAccounts),
      db.select().from(schema.xPosts),
      db.select().from(schema.syncJobs),
    ]);

    return {
      userCount: users.length,
      xAccountCount: xAccounts.length,
      postCount: posts.length,
      syncJobCount: syncJobs.length,
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return {
      userCount: 0,
      xAccountCount: 0,
      postCount: 0,
      syncJobCount: 0,
    };
  }
}

// Export schema for external use
export { schema };
