# Secrets Management Guide

This document provides detailed instructions for managing secrets across different environments in the X-manage-app project.

## 🔐 Security Principles

1. **Never commit secrets to Git** - All sensitive data stays out of version control
2. **Environment separation** - Different secrets for dev, staging, and production
3. **Least privilege access** - Each service gets only the permissions it needs
4. **Regular rotation** - Secrets are rotated on a schedule
5. **Audit trail** - All secret access is logged and monitored

## 📋 Required Secrets

### Database Secrets
- `DATABASE_URL`: Local development database connection
- `TURSO_DATABASE_URL`: Production Turso database URL
- `TURSO_AUTH_TOKEN`: Authentication token for Turso

### Authentication Secrets
- `BETTER_AUTH_SECRET`: Secret key for Better Auth (32+ random characters)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### X API Secrets
- `X_API_KEY`: X API consumer key
- `X_API_SECRET`: X API consumer secret
- `X_BEARER_TOKEN`: X API bearer token
- `X_CLIENT_ID`: X OAuth 2.0 client ID
- `X_CLIENT_SECRET`: X OAuth 2.0 client secret

### Infrastructure Secrets
- `CLOUDFLARE_API_TOKEN`: Cloudflare API token for deployments
- `SENTRY_AUTH_TOKEN`: Sentry authentication token
- `NEXT_PUBLIC_SENTRY_DSN`: Public Sentry DSN for frontend
- `SENTRY_API_DSN`: Private Sentry DSN for API

## 🛠️ Setup Instructions

### 1. Development Environment

#### Option A: Manual Setup
```bash
# Copy the template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

#### Option B: 1Password Integration (Recommended)
```bash
# Install 1Password CLI
brew install 1password-cli

# Sign in to 1Password
eval $(op signin)

# Create a vault for the project
op vault create "X-manage-dev"

# Store secrets in 1Password
op item create --category=login --title="X-manage Database" \
  --vault="X-manage-dev" \
  url="turso.tech" \
  username="database" \
  password="your-turso-auth-token"

# Load secrets from 1Password
export DATABASE_URL=$(op read "op://X-manage-dev/Database/url")
export TURSO_AUTH_TOKEN=$(op read "op://X-manage-dev/Database/password")
```

### 2. Production Environment

#### Cloudflare Workers Secrets
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Set secrets for the API worker
wrangler secret put DATABASE_URL --env production
wrangler secret put TURSO_AUTH_TOKEN --env production
wrangler secret put X_API_KEY --env production
wrangler secret put X_API_SECRET --env production
wrangler secret put X_BEARER_TOKEN --env production
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put SENTRY_API_DSN --env production
```

#### Cloudflare Pages Environment Variables
Set these in the Cloudflare Dashboard under Pages > Settings > Environment Variables:

- `NEXT_PUBLIC_SENTRY_DSN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL`
- `BETTER_AUTH_SECRET`

#### GitHub Actions Secrets
Set these in GitHub repository settings under Secrets and Variables > Actions:

- `CLOUDFLARE_API_TOKEN`: For deployment automation
- `TURSO_AUTH_TOKEN`: For database migrations in CI
- `SENTRY_AUTH_TOKEN`: For release tracking

### 3. Staging Environment

Follow the same process as production but use staging-specific values and the `--env staging` flag for Wrangler commands.

## 🔄 Secret Rotation Schedule

### Automated Rotation (Recommended)
Set up automated rotation using GitHub Actions:

```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets
on:
  schedule:
    - cron: '0 2 1 * *'  # Monthly on the 1st at 2 AM UTC
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Rotate Database Tokens
        run: |
          # Script to rotate Turso tokens
          # Update Cloudflare secrets
          # Update GitHub secrets
```

### Manual Rotation
- **Database tokens**: Every 90 days
- **API keys**: Every 180 days  
- **Auth secrets**: Every 30 days
- **Infrastructure tokens**: Every 60 days

## 🚨 Emergency Procedures

### Compromised Secret Response
1. **Immediately revoke** the compromised secret
2. **Generate new secret** with the same permissions
3. **Update all environments** (dev, staging, production)
4. **Verify applications** are working with new secrets
5. **Document the incident** and review access logs

### Secret Recovery
If you lose access to secrets:

1. **Database**: Contact Turso support or regenerate tokens
2. **X API**: Regenerate keys in X Developer Portal
3. **Google OAuth**: Regenerate credentials in Google Cloud Console
4. **Cloudflare**: Generate new API tokens in Cloudflare Dashboard

## 📊 Monitoring & Auditing

### Secret Usage Monitoring
- Enable Cloudflare audit logs
- Monitor Sentry for authentication errors
- Set up alerts for failed API calls
- Track secret access patterns

### Security Alerts
Set up alerts for:
- Failed authentication attempts
- Unusual API usage patterns
- Secret rotation failures
- Unauthorized access attempts

## 🔧 Development Scripts

### Secret Validation Script
```bash
#!/bin/bash
# scripts/validate-secrets.sh

echo "🔍 Validating secrets..."

# Check database connection
if turso db show $TURSO_DATABASE_URL > /dev/null 2>&1; then
  echo "✅ Database connection valid"
else
  echo "❌ Database connection failed"
fi

# Check X API
if curl -H "Authorization: Bearer $X_BEARER_TOKEN" \
   "https://api.twitter.com/2/users/me" > /dev/null 2>&1; then
  echo "✅ X API connection valid"
else
  echo "❌ X API connection failed"
fi

# Check Google OAuth
if curl "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=$GOOGLE_CLIENT_ID" \
   > /dev/null 2>&1; then
  echo "✅ Google OAuth configuration valid"
else
  echo "❌ Google OAuth configuration failed"
fi
```

### Secret Generation Script
```bash
#!/bin/bash
# scripts/generate-secrets.sh

echo "🔑 Generating new secrets..."

# Generate Better Auth secret
echo "BETTER_AUTH_SECRET=\"$(openssl rand -base64 32)\""

# Generate random API keys (for testing)
echo "TEST_API_KEY=\"$(openssl rand -hex 16)\""
echo "TEST_API_SECRET=\"$(openssl rand -hex 32)\""
```

## 📚 Additional Resources

- [Cloudflare Workers Secrets Documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
- [1Password CLI Documentation](https://developer.1password.com/docs/cli/)
- [Turso Authentication Guide](https://docs.turso.tech/reference/client-access-tokens)
- [X API Authentication](https://developer.twitter.com/en/docs/authentication/overview)
- [Better Auth Configuration](https://better-auth.com/docs/configuration)

## 🆘 Support

If you encounter issues with secrets management:

1. Check this documentation first
2. Review the troubleshooting section in README.md
3. Create a GitHub issue with the `secrets` label
4. For security-sensitive issues, contact maintainers directly
