# X-manage-app

A modern web application for managing X (formerly Twitter) posts with analytics and insights.

## 🚀 Features

- **Authentication**: Secure login with Google OAuth or email magic links (no passwords)
- **X Integration**: Connect your X account to manage posts and fetch analytics
- **Analytics Dashboard**: View post performance metrics and insights
- **Modern UI**: Clean, functional design with TRON-inspired color scheme
- **Real-time Sync**: Automated daily sync of post data and metrics

## 🏗️ Architecture

- **Frontend**: Next.js 14+ with App Router, React, Tailwind CSS v4, shadcn/ui
- **Backend**: Hono API running on Cloudflare Workers
- **Database**: Turso (libSQL/SQLite) with Drizzle ORM
- **Authentication**: Better Auth (successor to NextAuth.js)
- **Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (API)
- **Observability**: Sentry for error tracking and performance monitoring

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ and pnpm 8+
- GitHub account with repository access
- Cloudflare account (for deployment)
- Turso account (for database)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/tokechan/X-manege-app.git
cd X-manege-app

# Install dependencies
pnpm install

# Set up environment variables (see Secrets Management below)
cp .env.example .env.local

# Start development servers
pnpm dev
```

## 🔐 Secrets Management

This project uses a multi-layered approach to secrets management for security and convenience.

### Development Environment

**Local Development** (`.env.local` files):
```bash
# Database
DATABASE_URL="libsql://local.db"
TURSO_DATABASE_URL="libsql://[your-database].turso.io"
TURSO_AUTH_TOKEN="your-turso-token"

# Authentication
BETTER_AUTH_SECRET="your-local-auth-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# X API
X_API_KEY="your-x-api-key"
X_API_SECRET="your-x-api-secret"
X_BEARER_TOKEN="your-x-bearer-token"

# Sentry
NEXT_PUBLIC_SENTRY_DSN="your-sentry-web-dsn"
SENTRY_API_DSN="your-sentry-api-dsn"
```

**Recommended: 1Password Integration**
- Store all development secrets in a dedicated 1Password vault
- Use 1Password CLI for secure secret injection:
  ```bash
  # Install 1Password CLI
  brew install 1password-cli
  
  # Load secrets from 1Password
  eval $(op signin)
  export DATABASE_URL=$(op read "op://X-manage-dev/Database/url")
  ```

### Production Environment

**Cloudflare Secrets** (for Workers and Pages):
```bash
# Set Cloudflare Workers secrets
wrangler secret put DATABASE_URL
wrangler secret put TURSO_AUTH_TOKEN
wrangler secret put X_API_KEY
wrangler secret put BETTER_AUTH_SECRET

# Set Cloudflare Pages environment variables
# Via Cloudflare Dashboard: Pages > Settings > Environment Variables
```

**GitHub Actions Secrets** (for CI/CD):
- `CLOUDFLARE_API_TOKEN`: For deployment automation
- `TURSO_AUTH_TOKEN`: For database migrations
- `SENTRY_AUTH_TOKEN`: For release tracking

### Environment Files Structure

```
.env.example          # Template with all required variables
.env.local           # Local development (gitignored)
.env.test            # Test environment (gitignored)
.env.production      # Production template (gitignored)
```

### Security Best Practices

1. **Never commit secrets to Git**
   - All `.env.*` files (except `.env.example`) are gitignored
   - Use placeholder values in `.env.example`

2. **Rotate secrets regularly**
   - Database tokens: Every 90 days
   - API keys: Every 180 days
   - Auth secrets: Every 30 days

3. **Use least-privilege access**
   - X API: Read-only permissions where possible
   - Database: Separate read/write credentials
   - Cloudflare: Scoped API tokens

4. **Monitor secret usage**
   - Enable Sentry for unauthorized access attempts
   - Set up Cloudflare audit logs
   - Monitor API rate limits and unusual patterns

## 📦 Project Structure

```
.
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Hono API (Cloudflare Workers)
├── packages/
│   └── ui/               # Shared UI components (optional)
├── drizzle/              # Database migrations and schema
├── docs/                 # Project documentation
├── scripts/              # Automation scripts
├── .github/
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/   # Issue templates
├── plan.md               # Implementation roadmap
└── CONTRIBUTING.md       # Development workflow
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests only
pnpm test:e2e

# With coverage
pnpm test:coverage
```

## 🚀 Deployment

### Staging Deployment
```bash
# Deploy to staging
pnpm deploy:staging
```

### Production Deployment
```bash
# Deploy to production (requires approval)
pnpm deploy:production
```

### Automated Deployment
- **Preview**: Automatic deployment on PR creation
- **Staging**: Automatic deployment on merge to `develop`
- **Production**: Manual deployment with approval on merge to `main`

## 📊 Monitoring & Observability

- **Error Tracking**: Sentry integration for both frontend and API
- **Performance**: Core Web Vitals monitoring
- **Uptime**: Synthetic monitoring for critical user journeys
- **Logs**: Structured logging with Cloudflare Workers

### Sentry Projects
- `x-manage-web`: Frontend error tracking and performance
- `x-manage-api`: Backend API monitoring and alerts

## 🔄 Data Sync

**Daily Sync Schedule**: 02:30 UTC
- Optimized for X API rate limits
- Low-traffic window for minimal user impact
- Automatic retry with exponential backoff

**Sync Process**:
1. Fetch new posts from X API
2. Update existing post metrics
3. Store data in Turso database
4. Send success/failure notifications

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development workflow and guidelines.

### Quick Development Workflow

1. **Pick an Issue**: Check [GitHub Issues](https://github.com/tokechan/X-manege-app/issues)
2. **Create Branch**: `git checkout -b feature/issue-number-description`
3. **Develop**: Make changes with tests
4. **Test**: Run `pnpm test` locally
5. **Submit PR**: Link to the related issue

## 📋 Milestones

- [x] **M0**: Project Bootstrap (Setup, tooling, basic structure)
- [ ] **M1**: Authentication (Google OAuth, Better Auth integration)
- [ ] **M2**: X Account Connection (OAuth flow, token management)
- [ ] **M3**: Analytics Ingestion (X API integration, data sync)
- [ ] **M4**: Post Management UI (Dashboard, filters, analytics views)
- [ ] **M5**: Production Hardening (Monitoring, CI/CD, documentation)

## 🆘 Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check Turso connection
turso db show [your-database]

# Test local libSQL
sqlite3 local.db ".tables"
```

**Authentication Issues**:
```bash
# Verify Google OAuth setup
curl -X GET "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=[token]"
```

**X API Rate Limits**:
- Check rate limit headers in API responses
- Verify bearer token validity
- Ensure sync window alignment (02:30 UTC)

### Getting Help

1. Check existing [GitHub Issues](https://github.com/tokechan/X-manege-app/issues)
2. Review [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
3. Create a new issue with the appropriate template

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with ❤️ using modern web technologies and best practices.