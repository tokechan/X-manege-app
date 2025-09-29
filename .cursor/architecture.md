# Architecture and Technical Guidelines

## System Architecture

### Frontend (Next.js App)

```
apps/web/
├── src/
│   ├── app/                 # Next.js 15 App Router
│   │   ├── (auth)/         # Route groups
│   │   ├── api/            # API routes
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── auth/          # Authentication components
│   │   └── providers/     # React context providers
│   ├── lib/               # Utility libraries
│   │   ├── auth/         # Authentication logic
│   │   └── utils.ts      # Helper functions
│   └── types/            # TypeScript type definitions
```

### Backend (Cloudflare Workers)

```
apps/api/
├── src/
│   ├── routes/            # API route handlers
│   │   ├── auth.ts       # Authentication routes
│   │   ├── posts.ts      # Post management
│   │   └── analytics.ts  # Analytics endpoints
│   ├── lib/              # Shared utilities
│   │   ├── database.ts   # Database connection
│   │   └── middleware/   # Request middleware
│   ├── handlers/         # Event handlers
│   └── types/            # API type definitions
```

### Database Schema

```
drizzle/
├── schemas/
│   ├── auth.ts           # User authentication tables
│   ├── x-accounts.ts     # X account connections
│   ├── x-posts.ts        # Post data and metrics
│   └── sync-jobs.ts      # Background job tracking
├── migrations/           # Database migrations
└── db.ts                # Database configuration
```

## Data Flow Architecture

### Authentication Flow

1. User initiates login via NextAuth.js
2. OAuth flow with Google or magic link with email
3. Session stored in database via Drizzle adapter
4. JWT token managed by NextAuth.js
5. Protected routes check authentication status

### X Integration Flow

1. User provides X API credentials in settings
2. Credentials encrypted and stored in database
3. Background job fetches posts and metrics
4. Data synchronized with local database
5. Analytics computed and cached

### Real-time Updates

```typescript
// WebSocket connection for real-time updates
const useRealtimeUpdates = () => {
  useEffect(() => {
    const ws = new WebSocket('/api/ws');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      // Handle real-time updates
    };

    return () => ws.close();
  }, []);
};
```

## API Design Patterns

### RESTful Endpoints

```typescript
// Standard CRUD operations
GET    /api/posts          # List posts with pagination
GET    /api/posts/:id      # Get specific post
POST   /api/posts          # Create new post
PUT    /api/posts/:id      # Update post
DELETE /api/posts/:id      # Delete post

// Nested resources
GET    /api/posts/:id/analytics    # Post analytics
POST   /api/accounts/:id/sync      # Trigger sync
```

### Request/Response Format

```typescript
// Standard API response format
interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

// Request validation
const PostSchema = z.object({
  title: z.string().min(1).max(280),
  content: z.string().min(1),
  scheduledAt: z.date().optional(),
});
```

## State Management

### React Context for Global State

```typescript
// Auth context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Settings context
interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  isLoading: boolean;
}
```

### Local State Management

```typescript
// Use useState for component-level state
const [formData, setFormData] = useState<FormData>({
  title: '',
  content: '',
});

// Use useReducer for complex state logic
const [state, dispatch] = useReducer(postReducer, initialState);
```

## Database Patterns

### Schema Design

```typescript
// User table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Relationships
export const xAccounts = sqliteTable('x_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  username: text('username').notNull(),
  accessToken: text('access_token').notNull(), // Encrypted
  refreshToken: text('refresh_token'), // Encrypted
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});
```

### Query Patterns

```typescript
// Use Drizzle for type-safe queries
export async function getUserPosts(userId: string, limit = 20) {
  return await db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

// Complex queries with joins
export async function getPostAnalytics(postId: string) {
  return await db
    .select({
      post: posts,
      analytics: analytics,
      account: xAccounts,
    })
    .from(posts)
    .leftJoin(analytics, eq(posts.id, analytics.postId))
    .leftJoin(xAccounts, eq(posts.accountId, xAccounts.id))
    .where(eq(posts.id, postId));
}
```

## Error Handling Strategy

### API Error Handling

```typescript
// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// Error middleware
export const errorHandler = (error: unknown, c: Context) => {
  if (error instanceof ApiError) {
    return c.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      error.statusCode
    );
  }

  console.error('Unexpected error:', error);
  return c.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    500
  );
};
```

### Frontend Error Handling

```typescript
// Error boundary for React components
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={({ error, resetError }) => (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <Button onClick={resetError}>Try again</Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

## Security Considerations

### Authentication Security

- Use secure HTTP-only cookies for sessions
- Implement CSRF protection
- Validate JWT tokens on every request
- Use secure password hashing (handled by NextAuth.js)

### API Security

```typescript
// Rate limiting middleware
export const rateLimiter = (requests: number, windowMs: number) => {
  const clients = new Map();

  return async (c: Context, next: Next) => {
    const clientId = c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!clients.has(clientId)) {
      clients.set(clientId, []);
    }

    const clientRequests = clients.get(clientId);
    const recentRequests = clientRequests.filter(
      (time: number) => time > windowStart
    );

    if (recentRequests.length >= requests) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    recentRequests.push(now);
    clients.set(clientId, recentRequests);

    await next();
  };
};
```

### Data Protection

- Encrypt sensitive data (API keys, tokens)
- Use environment variables for secrets
- Implement proper CORS policies
- Sanitize user input

## Performance Optimization

### Frontend Performance

```typescript
// Code splitting with dynamic imports
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

// Image optimization
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="User avatar"
  width={40}
  height={40}
  className="rounded-full"
/>;

// Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexMetrics(data);
}, [data]);
```

### Backend Performance

```typescript
// Database connection pooling
const db = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Caching strategies
const cache = new Map();

export async function getCachedData(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await fetcher();
  cache.set(key, data);

  // Auto-expire cache entries
  setTimeout(() => cache.delete(key), 5 * 60 * 1000); // 5 minutes

  return data;
}
```

## Deployment Architecture

### Cloudflare Infrastructure

- **Pages**: Frontend hosting with edge caching
- **Workers**: Serverless API functions
- **D1**: SQLite database (via Turso)
- **KV**: Key-value storage for caching
- **R2**: Object storage for files

### Environment Configuration

```typescript
// Environment-specific configurations
const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    dbUrl: process.env.DATABASE_URL_DEV,
  },
  staging: {
    apiUrl: 'https://api-staging.example.com',
    dbUrl: process.env.DATABASE_URL_STAGING,
  },
  production: {
    apiUrl: 'https://api.example.com',
    dbUrl: process.env.DATABASE_URL,
  },
};
```

## Monitoring and Observability

### Logging Strategy

```typescript
// Structured logging
const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  },
  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  },
};
```

### Performance Monitoring

- Use Web Vitals for frontend metrics
- Monitor API response times
- Track database query performance
- Set up alerts for error rates
