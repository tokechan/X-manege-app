/**
 * X Posts Schema
 * Tables for storing X posts and their analytics data
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { xAccounts } from './x-accounts';

// X posts/tweets
export const xPosts = sqliteTable('x_posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  xAccountId: text('x_account_id').notNull().references(() => xAccounts.id, { onDelete: 'cascade' }),
  
  // X post information
  xPostId: text('x_post_id').notNull().unique(), // X's internal post ID
  text: text('text').notNull(),
  
  // Post metadata
  postType: text('post_type').notNull(), // 'tweet' | 'reply' | 'retweet' | 'quote'
  language: text('language'),
  source: text('source'), // App/platform used to post
  
  // Conversation context
  conversationId: text('conversation_id'),
  inReplyToPostId: text('in_reply_to_post_id'),
  referencedPostId: text('referenced_post_id'), // For retweets/quotes
  
  // Content analysis
  hasMedia: integer('has_media', { mode: 'boolean' }).default(false),
  hasLinks: integer('has_links', { mode: 'boolean' }).default(false),
  hasHashtags: integer('has_hashtags', { mode: 'boolean' }).default(false),
  hasMentions: integer('has_mentions', { mode: 'boolean' }).default(false),
  
  // Content details (JSON)
  mediaUrls: text('media_urls'), // JSON array of media URLs
  links: text('links'), // JSON array of links
  hashtags: text('hashtags'), // JSON array of hashtags
  mentions: text('mentions'), // JSON array of mentions
  
  // Post timing
  publishedAt: integer('published_at', { mode: 'timestamp' }).notNull(),
  
  // Status
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  
  // Sync metadata
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  xAccountIdIdx: index('x_posts_x_account_id_idx').on(table.xAccountId),
  xPostIdIdx: index('x_posts_x_post_id_idx').on(table.xPostId),
  publishedAtIdx: index('x_posts_published_at_idx').on(table.publishedAt),
  postTypeIdx: index('x_posts_post_type_idx').on(table.postType),
  conversationIdIdx: index('x_posts_conversation_id_idx').on(table.conversationId),
  lastSyncAtIdx: index('x_posts_last_sync_at_idx').on(table.lastSyncAt),
}));

// X post metrics (time-series data)
export const xPostMetrics = sqliteTable('x_post_metrics', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  xPostId: text('x_post_id').notNull().references(() => xPosts.id, { onDelete: 'cascade' }),
  
  // Core engagement metrics
  impressions: integer('impressions').default(0),
  likes: integer('likes').default(0),
  reposts: integer('reposts').default(0),
  replies: integer('replies').default(0),
  bookmarks: integer('bookmarks').default(0),
  
  // Click metrics
  profileClicks: integer('profile_clicks').default(0),
  linkClicks: integer('link_clicks').default(0),
  detailExpands: integer('detail_expands').default(0),
  
  // Media metrics (when applicable)
  videoViews: integer('video_views').default(0),
  photoViews: integer('photo_views').default(0),
  
  // Calculated metrics
  engagementRate: real('engagement_rate').default(0), // Percentage
  clickThroughRate: real('click_through_rate').default(0), // Percentage
  
  // Metric metadata
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull(),
  metricsAge: integer('metrics_age').notNull(), // Hours since post publication
  
  // Data quality
  isEstimated: integer('is_estimated', { mode: 'boolean' }).default(false),
  dataSource: text('data_source').default('api'), // 'api' | 'webhook' | 'manual'
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  xPostIdIdx: index('x_post_metrics_x_post_id_idx').on(table.xPostId),
  recordedAtIdx: index('x_post_metrics_recorded_at_idx').on(table.recordedAt),
  metricsAgeIdx: index('x_post_metrics_metrics_age_idx').on(table.metricsAge),
  impressionsIdx: index('x_post_metrics_impressions_idx').on(table.impressions),
}));

// X post performance summary (aggregated view)
export const xPostPerformanceSummary = sqliteTable('x_post_performance_summary', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  xPostId: text('x_post_id').notNull().references(() => xPosts.id, { onDelete: 'cascade' }).unique(),
  
  // Latest metrics (most recent snapshot)
  latestImpressions: integer('latest_impressions').default(0),
  latestLikes: integer('latest_likes').default(0),
  latestReposts: integer('latest_reposts').default(0),
  latestReplies: integer('latest_replies').default(0),
  latestBookmarks: integer('latest_bookmarks').default(0),
  latestProfileClicks: integer('latest_profile_clicks').default(0),
  latestLinkClicks: integer('latest_link_clicks').default(0),
  
  // Peak metrics (highest recorded values)
  peakImpressions: integer('peak_impressions').default(0),
  peakLikes: integer('peak_likes').default(0),
  peakReposts: integer('peak_reposts').default(0),
  peakReplies: integer('peak_replies').default(0),
  peakBookmarks: integer('peak_bookmarks').default(0),
  
  // Performance indicators
  totalEngagement: integer('total_engagement').default(0), // Sum of likes, reposts, replies, bookmarks
  bestEngagementRate: real('best_engagement_rate').default(0),
  averageEngagementRate: real('average_engagement_rate').default(0),
  
  // Timing analysis
  peakEngagementHour: integer('peak_engagement_hour'), // Hour when most engagement occurred
  timeToPeak: integer('time_to_peak'), // Minutes to reach peak engagement
  
  // Performance score (0-100)
  performanceScore: real('performance_score').default(0),
  
  // Comparison metrics
  vsAccountAverage: real('vs_account_average').default(0), // Performance vs account average
  percentileRank: real('percentile_rank').default(0), // Percentile rank among account's posts
  
  // Update tracking
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  metricsCount: integer('metrics_count').default(0), // Number of metric snapshots
  
  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  xPostIdIdx: index('x_post_performance_summary_x_post_id_idx').on(table.xPostId),
  performanceScoreIdx: index('x_post_performance_summary_performance_score_idx').on(table.performanceScore),
  totalEngagementIdx: index('x_post_performance_summary_total_engagement_idx').on(table.totalEngagement),
  lastUpdatedAtIdx: index('x_post_performance_summary_last_updated_at_idx').on(table.lastUpdatedAt),
}));

// Content analysis and insights
export const xPostInsights = sqliteTable('x_post_insights', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  xPostId: text('x_post_id').notNull().references(() => xPosts.id, { onDelete: 'cascade' }).unique(),
  
  // Content analysis
  wordCount: integer('word_count').default(0),
  characterCount: integer('character_count').default(0),
  sentimentScore: real('sentiment_score'), // -1 to 1 (negative to positive)
  
  // Hashtag analysis
  hashtagCount: integer('hashtag_count').default(0),
  topHashtags: text('top_hashtags'), // JSON array of hashtags with counts
  
  // Mention analysis
  mentionCount: integer('mention_count').default(0),
  topMentions: text('top_mentions'), // JSON array of mentions
  
  // Link analysis
  linkCount: integer('link_count').default(0),
  linkDomains: text('link_domains'), // JSON array of domains
  
  // Media analysis
  mediaCount: integer('media_count').default(0),
  mediaTypes: text('media_types'), // JSON array of media types
  
  // Timing insights
  postHour: integer('post_hour'), // Hour of day (0-23)
  postDayOfWeek: integer('post_day_of_week'), // Day of week (0-6, Sunday=0)
  postMonth: integer('post_month'), // Month (1-12)
  
  // Performance predictors
  predictedEngagement: real('predicted_engagement'),
  confidenceScore: real('confidence_score'),
  
  // Metadata
  analyzedAt: integer('analyzed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  analysisVersion: text('analysis_version').default('1.0'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  xPostIdIdx: index('x_post_insights_x_post_id_idx').on(table.xPostId),
  postHourIdx: index('x_post_insights_post_hour_idx').on(table.postHour),
  postDayOfWeekIdx: index('x_post_insights_post_day_of_week_idx').on(table.postDayOfWeek),
  sentimentScoreIdx: index('x_post_insights_sentiment_score_idx').on(table.sentimentScore),
}));

// Types for TypeScript
export type XPost = typeof xPosts.$inferSelect;
export type NewXPost = typeof xPosts.$inferInsert;
export type XPostMetrics = typeof xPostMetrics.$inferSelect;
export type NewXPostMetrics = typeof xPostMetrics.$inferInsert;
export type XPostPerformanceSummary = typeof xPostPerformanceSummary.$inferSelect;
export type NewXPostPerformanceSummary = typeof xPostPerformanceSummary.$inferInsert;
export type XPostInsights = typeof xPostInsights.$inferSelect;
export type NewXPostInsights = typeof xPostInsights.$inferInsert;
