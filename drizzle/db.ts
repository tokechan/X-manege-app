/**
 * Database Connection Utilities
 * Provides database clients for different environments
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Database client type
export type DatabaseClient = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Create database client for Turso (production)
 */
export function createTursoClient(url: string, authToken: string): DatabaseClient {
  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
}

/**
 * Create database client for local development
 */
export function createLocalClient(url: string = 'file:local.db'): DatabaseClient {
  const client = createClient({
    url,
  });

  return drizzle(client, { schema });
}

/**
 * Create database client based on environment
 */
export function createDatabaseClient(config?: {
  url?: string;
  authToken?: string;
  environment?: string;
}): DatabaseClient {
  const {
    url = process.env.DATABASE_URL || 'file:local.db',
    authToken = process.env.TURSO_AUTH_TOKEN,
    environment = process.env.NODE_ENV || 'development',
  } = config || {};

  // Use Turso for production/staging, local SQLite for development
  if (environment === 'production' || environment === 'staging') {
    if (!authToken) {
      throw new Error('TURSO_AUTH_TOKEN is required for production/staging');
    }
    return createTursoClient(url, authToken);
  } else {
    return createLocalClient(url);
  }
}

/**
 * Database connection singleton
 */
let dbInstance: DatabaseClient | null = null;

export function getDatabase(config?: Parameters<typeof createDatabaseClient>[0]): DatabaseClient {
  if (!dbInstance) {
    dbInstance = createDatabaseClient(config);
  }
  return dbInstance;
}

/**
 * Close database connection (for cleanup)
 */
export function closeDatabaseConnection(): void {
  dbInstance = null;
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(db?: DatabaseClient): Promise<boolean> {
  try {
    const database = db || getDatabase();
    
    // Simple query to test connection
    await database.select().from(schema.users).limit(1);
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Database migration utilities
 */
export async function runMigrations(db?: DatabaseClient): Promise<void> {
  const database = db || getDatabase();
  
  // Note: In a real implementation, you would use drizzle-kit migrate
  // This is a placeholder for the migration logic
  console.log('Running database migrations...');
  
  // The actual migration would be:
  // import { migrate } from 'drizzle-orm/libsql/migrator';
  // await migrate(database, { migrationsFolder: './drizzle/migrations' });
}

/**
 * Seed database with initial data (development only)
 */
export async function seedDatabase(db?: DatabaseClient): Promise<void> {
  const database = db || getDatabase();
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database seeding is not allowed in production');
  }
  
  console.log('Seeding database with initial data...');
  
  // Example seed data (you would customize this)
  try {
    // Create a test user
    const [testUser] = await database.insert(schema.users).values({
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
    }).returning();
    
    console.log('Created test user:', testUser.id);
    
    // Create user preferences
    await database.insert(schema.userPreferences).values({
      userId: testUser.id,
      timezone: 'UTC',
      theme: 'system',
    });
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

/**
 * Database statistics and monitoring
 */
export async function getDatabaseStats(db?: DatabaseClient): Promise<{
  userCount: number;
  xAccountCount: number;
  postCount: number;
  metricsCount: number;
  syncJobCount: number;
}> {
  const database = db || getDatabase();
  
  try {
    const [
      userCount,
      xAccountCount,
      postCount,
      metricsCount,
      syncJobCount,
    ] = await Promise.all([
      database.select({ count: schema.users.id }).from(schema.users),
      database.select({ count: schema.xAccounts.id }).from(schema.xAccounts),
      database.select({ count: schema.xPosts.id }).from(schema.xPosts),
      database.select({ count: schema.xPostMetrics.id }).from(schema.xPostMetrics),
      database.select({ count: schema.syncJobs.id }).from(schema.syncJobs),
    ]);
    
    return {
      userCount: userCount.length,
      xAccountCount: xAccountCount.length,
      postCount: postCount.length,
      metricsCount: metricsCount.length,
      syncJobCount: syncJobCount.length,
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    throw error;
  }
}

// Export schema for external use
export { schema };
export type { DatabaseConfig, PaginationOptions, DateRangeFilter, PostFilters, MetricsFilters } from './schema';
