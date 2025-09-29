# Analytics Scope & Backfill Strategy

This document defines the analytics scope, backfill windows, and data retention policies for X-manage-app.

## 📊 Analytics Scope Definition

### Core Metrics to Track

#### 1. Post Performance Metrics

**Primary Metrics** (Always collected):

- **Impressions**: Number of times the post was seen
- **Likes**: Number of likes received
- **Reposts**: Number of reposts/retweets
- **Replies**: Number of replies received
- **Bookmarks**: Number of times bookmarked
- **Profile Clicks**: Clicks on the user's profile from this post
- **Link Clicks**: Clicks on links within the post (if any)

**Secondary Metrics** (Collected when available):

- **Quote Tweets**: Number of quote tweets
- **Video Views**: For video content
- **Photo Views**: For image content
- **Detail Expands**: Number of times "Show this thread" was clicked

#### 2. Engagement Rates (Calculated)

- **Engagement Rate**: (Likes + Reposts + Replies + Bookmarks) / Impressions
- **Click-through Rate**: Link Clicks / Impressions
- **Profile Click Rate**: Profile Clicks / Impressions
- **Bookmark Rate**: Bookmarks / Impressions

#### 3. Temporal Analysis

- **Peak Engagement Hours**: When posts receive most engagement
- **Day-of-Week Performance**: Performance patterns by day
- **Time-to-Peak**: How long it takes to reach peak engagement
- **Engagement Decay**: How engagement drops over time

#### 4. Content Analysis

- **Post Type Performance**: Text, Image, Video, Link performance
- **Hashtag Performance**: Performance by hashtags used
- **Mention Impact**: Performance when mentioning other users
- **Thread Performance**: Performance of threaded posts

### Data Collection Frequency

#### Real-time Collection (Via Webhooks - Future)

- New posts published
- Immediate engagement (first hour)

#### Batch Collection (Via Cron Jobs)

- **Hourly**: Recent posts (last 24 hours) for trending analysis
- **Daily**: All posts from last 7 days for comprehensive metrics
- **Weekly**: Historical posts (7-30 days) for trend analysis

## 🕐 Backfill Window Strategy

### Initial Backfill (New User Onboarding)

#### Option 1: Conservative (Recommended)

- **Window**: 30 days
- **Rationale**: Balances data value with API costs
- **API Requests**: ~150-300 requests per user
- **Time to Complete**: 15-30 minutes per user

#### Option 2: Standard

- **Window**: 60 days
- **Rationale**: Provides seasonal context and trend analysis
- **API Requests**: ~300-600 requests per user
- **Time to Complete**: 30-60 minutes per user

#### Option 3: Comprehensive

- **Window**: 90 days
- **Rationale**: Full quarterly analysis and comprehensive insights
- **API Requests**: ~450-900 requests per user
- **Time to Complete**: 45-90 minutes per user

### Recommended Configuration

```typescript
const backfillConfig = {
  // Default backfill window for new users
  defaultDays: 60,

  // Maximum backfill window (user can request)
  maxDays: 90,

  // Minimum backfill window
  minDays: 7,

  // Batch size for API requests
  batchSize: 100, // tweets per request

  // Rate limiting
  maxRequestsPerUser: 600, // for 60-day backfill
  requestDelayMs: 5000, // 5 seconds between requests

  // Prioritization
  priorityOrder: [
    'recent_posts', // Last 7 days first
    'high_engagement', // Posts with >100 impressions
    'chronological', // Remaining posts in chronological order
  ],
};
```

## 📈 Data Retention Policy

### Hot Data (Frequently Accessed)

- **Duration**: 30 days
- **Storage**: Primary database (Turso)
- **Access Pattern**: Real-time queries, dashboard display
- **Includes**: Recent posts, current metrics, active trends

### Warm Data (Periodic Access)

- **Duration**: 31-365 days
- **Storage**: Primary database with optimized indexes
- **Access Pattern**: Historical analysis, trend reports
- **Includes**: Historical posts, aggregated metrics

### Cold Data (Archive)

- **Duration**: 1+ years
- **Storage**: R2 bucket (compressed JSON)
- **Access Pattern**: Rare, analytical deep-dives
- **Includes**: Raw API responses, detailed historical data

### Data Lifecycle

```typescript
const dataLifecycle = {
  // Move to warm storage after 30 days
  warmTransition: 30 * 24 * 60 * 60 * 1000, // 30 days

  // Move to cold storage after 1 year
  coldTransition: 365 * 24 * 60 * 60 * 1000, // 1 year

  // Delete after 3 years (or user request)
  deletion: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years

  // Aggregation levels
  aggregation: {
    hourly: 7, // Keep hourly data for 7 days
    daily: 90, // Keep daily aggregates for 90 days
    weekly: 365, // Keep weekly aggregates for 1 year
    monthly: 1095, // Keep monthly aggregates for 3 years
  },
};
```

## 🎯 Analytics Use Cases

### Dashboard Views

#### 1. Overview Dashboard

- Last 30 days performance summary
- Top performing posts
- Engagement trends
- Growth metrics

#### 2. Post Performance

- Individual post metrics over time
- Comparison with average performance
- Engagement timeline
- Audience insights

#### 3. Content Strategy

- Best performing content types
- Optimal posting times
- Hashtag performance
- Audience engagement patterns

#### 4. Growth Analytics

- Follower growth correlation with post performance
- Engagement rate trends
- Reach and impression growth
- Profile click conversion

### Advanced Analytics (Future)

#### 1. Predictive Analytics

- Optimal posting time prediction
- Content performance prediction
- Engagement forecasting

#### 2. Competitive Analysis

- Industry benchmarking
- Competitor performance comparison
- Market trend analysis

#### 3. ROI Analysis

- Content ROI calculation
- Campaign performance tracking
- Conversion attribution

## 🔧 Implementation Priorities

### Phase 1: Core Metrics (M3)

- [x] Define data model
- [ ] Implement basic metric collection
- [ ] Set up 30-day backfill
- [ ] Create simple dashboard views

### Phase 2: Enhanced Analytics (M4)

- [ ] Add calculated engagement rates
- [ ] Implement trend analysis
- [ ] Create content performance insights
- [ ] Add time-based analytics

### Phase 3: Advanced Features (M5+)

- [ ] Predictive analytics
- [ ] Custom date ranges
- [ ] Export functionality
- [ ] Advanced filtering

## 📊 Metric Calculation Examples

### Engagement Rate

```typescript
function calculateEngagementRate(metrics: PostMetrics): number {
  const totalEngagement =
    metrics.likes + metrics.reposts + metrics.replies + metrics.bookmarks;

  return metrics.impressions > 0
    ? (totalEngagement / metrics.impressions) * 100
    : 0;
}
```

### Performance Score (Composite)

```typescript
function calculatePerformanceScore(metrics: PostMetrics): number {
  const weights = {
    impressions: 0.2,
    likes: 0.25,
    reposts: 0.3,
    replies: 0.15,
    bookmarks: 0.1,
  };

  // Normalize metrics (0-100 scale based on user's historical performance)
  const normalized = normalizeMetrics(metrics);

  return (
    normalized.impressions * weights.impressions +
    normalized.likes * weights.likes +
    normalized.reposts * weights.reposts +
    normalized.replies * weights.replies +
    normalized.bookmarks * weights.bookmarks
  );
}
```

## 🚨 Data Quality Considerations

### Missing Data Handling

- **Graceful Degradation**: Show available metrics even if some are missing
- **Backfill Jobs**: Retry failed data collection
- **Data Validation**: Ensure metric consistency and reasonableness

### Rate Limit Management

- **Prioritize Recent Data**: Focus on last 7 days for new users
- **Batch Processing**: Group requests efficiently
- **Progressive Enhancement**: Add historical data over time

### Privacy & Compliance

- **User Consent**: Clear opt-in for data collection
- **Data Minimization**: Only collect necessary metrics
- **Right to Deletion**: Support user data deletion requests
- **Anonymization**: Remove PII from analytics aggregates

## 📋 Configuration Summary

Based on this analysis, the recommended configuration is:

- **Default Backfill Window**: 60 days
- **Core Metrics**: 7 primary engagement metrics
- **Collection Frequency**: Daily batch jobs at 02:30 UTC
- **Data Retention**: 30 days hot, 1 year warm, 3 years cold
- **Rate Limiting**: 600 requests per user for initial backfill

This configuration provides comprehensive analytics while respecting API limits and storage costs.
