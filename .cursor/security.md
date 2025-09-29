# Security Guidelines and Best Practices

## Authentication & Authorization

### NextAuth.js Configuration

```typescript
// Secure NextAuth configuration
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      from: 'noreply@x-manage-app.com',
      apiKey: process.env.RESEND_API_KEY!,
    }),
  ],
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

### Route Protection

```typescript
// Middleware for protected routes
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isProtectedRoute = ['/settings', '/dashboard'].some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// API route protection
export async function requireAuth(c: Context) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verifyJWT(token);
    c.set('userId', payload.sub);
    return null; // Continue
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

## Data Encryption

### Sensitive Data Encryption

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage for X API credentials
export async function storeXCredentials(
  userId: string,
  credentials: XCredentials
) {
  const encryptedCredentials = {
    apiKey: encrypt(credentials.apiKey),
    apiSecret: encrypt(credentials.apiSecret),
    accessToken: encrypt(credentials.accessToken),
    accessTokenSecret: encrypt(credentials.accessTokenSecret),
  };

  await db.insert(xAccounts).values({
    userId,
    ...encryptedCredentials,
  });
}
```

### Environment Variables Security

```bash
# .env.example - Template for environment variables
# Never commit actual .env files

# Database
DATABASE_URL="libsql://your-database-url"
DATABASE_AUTH_TOKEN="your-auth-token"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-32-chars-min"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email
RESEND_API_KEY="your-resend-api-key"

# Encryption
ENCRYPTION_KEY="your-32-byte-encryption-key"

# X API (Optional - user provides these)
# These are examples, users input their own
X_API_KEY="example-api-key"
X_API_SECRET="example-api-secret"
```

## Input Validation & Sanitization

### Zod Schema Validation

```typescript
import { z } from 'zod';

// User input validation
export const UserSettingsSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(15, 'Username must be 15 characters or less')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),

  apiKey: z
    .string()
    .min(1, 'API Key is required')
    .max(500, 'API Key is too long'),

  apiSecret: z
    .string()
    .min(1, 'API Secret is required')
    .max(500, 'API Secret is too long'),

  accessToken: z
    .string()
    .min(1, 'Access Token is required')
    .max(500, 'Access Token is too long'),

  accessTokenSecret: z
    .string()
    .min(1, 'Access Token Secret is required')
    .max(500, 'Access Token Secret is too long'),
});

// API request validation
export const PostCreateSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(280, 'Content must be 280 characters or less'),

  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),

  media: z.array(z.string().url()).max(4, 'Maximum 4 media files').optional(),
});

// Usage in API routes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = PostCreateSchema.parse(body);

    // Process validated data
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
```

### SQL Injection Prevention

```typescript
// Always use parameterized queries with Drizzle
// ✅ Safe - parameterized query
export async function getUserPosts(userId: string) {
  return await db.select().from(posts).where(eq(posts.userId, userId)); // Safe parameterized query
}

// ❌ Never do this - SQL injection vulnerability
export async function unsafeQuery(userId: string) {
  return await db.execute(sql`SELECT * FROM posts WHERE user_id = ${userId}`);
}

// ✅ Safe way to use raw SQL if needed
export async function safeRawQuery(userId: string) {
  return await db.execute(
    sql`SELECT * FROM posts WHERE user_id = ${sql.placeholder('userId')}`,
    {
      userId,
    }
  );
}
```

## CORS & Security Headers

### CORS Configuration

```typescript
// Next.js API routes CORS
export async function middleware(request: NextRequest) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin':
          process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}
```

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.twitter.com https://*.turso.tech",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Rate Limiting

### API Rate Limiting

```typescript
// Simple in-memory rate limiter
class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private maxRequests: number, private windowMs: number) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const userRequests = this.requests.get(identifier)!;
    const recentRequests = userRequests.filter((time) => time > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }
}

// Usage in API routes
const limiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!limiter.isAllowed(ip)) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
      },
      { status: 429 }
    );
  }

  // Process request
}
```

## Secure File Handling

### File Upload Security

```typescript
// Secure file upload validation
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function validateFile(file: File): Promise<boolean> {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }

  // Check file signature (magic bytes)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG signature
  if (file.type === 'image/jpeg' && (bytes[0] !== 0xff || bytes[1] !== 0xd8)) {
    throw new Error('Invalid JPEG file');
  }

  // PNG signature
  if (
    file.type === 'image/png' &&
    (bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4e ||
      bytes[3] !== 0x47)
  ) {
    throw new Error('Invalid PNG file');
  }

  return true;
}
```

## Security Monitoring

### Audit Logging

```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
}

export async function logAuditEvent(event: AuditLog) {
  await db.insert(auditLogs).values({
    ...event,
    id: generateId(),
  });

  // Also log to external service for security monitoring
  if (process.env.SECURITY_WEBHOOK_URL) {
    await fetch(process.env.SECURITY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  }
}

// Usage
export async function updateUserSettings(
  userId: string,
  settings: any,
  request: Request
) {
  try {
    await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId));

    await logAuditEvent({
      userId,
      action: 'UPDATE_SETTINGS',
      resource: 'user_settings',
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
    });
  } catch (error) {
    await logAuditEvent({
      userId,
      action: 'UPDATE_SETTINGS',
      resource: 'user_settings',
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: false,
      details: { error: error.message },
    });

    throw error;
  }
}
```

## Security Testing

### Security Test Cases

```typescript
// Security-focused test cases
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without valid tokens', async () => {
      const response = await fetch('/api/protected-route');
      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = generateExpiredToken();
      const response = await fetch('/api/protected-route', {
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name: maliciousInput }),
      });
      expect(response.status).toBe(400);
    });

    it('should sanitize XSS attempts', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: xssPayload }),
      });
      const data = await response.json();
      expect(data.content).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(101)
        .fill(null)
        .map(() => fetch('/api/rate-limited-endpoint'));

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

## Incident Response

### Security Incident Handling

```typescript
// Security incident detection and response
export class SecurityIncidentDetector {
  private static readonly SUSPICIOUS_PATTERNS = [
    /union\s+select/i,
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];

  static detectSuspiciousActivity(input: string, context: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(input));
  }

  static async reportIncident(incident: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
    userId?: string;
    ipAddress?: string;
  }) {
    // Log incident
    console.error('Security incident detected:', incident);

    // Store in database
    await db.insert(securityIncidents).values({
      id: generateId(),
      ...incident,
      timestamp: new Date(),
    });

    // Alert security team for high/critical incidents
    if (incident.severity === 'high' || incident.severity === 'critical') {
      await this.alertSecurityTeam(incident);
    }
  }

  private static async alertSecurityTeam(incident: any) {
    // Send alert to security team
    // This could be email, Slack, PagerDuty, etc.
  }
}
```

Remember: Security is an ongoing process, not a one-time setup. Regularly review and update security measures, conduct security audits, and stay informed about new vulnerabilities and best practices.
