#!/bin/bash

# 1Password Integration Script for X-manage-app
# This script helps manage secrets using 1Password CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VAULT_NAME="X-manage-dev"
OP_ACCOUNT=""  # Set this if you have multiple 1Password accounts

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if 1Password CLI is installed and authenticated
check_1password() {
    if ! command -v op &> /dev/null; then
        log_error "1Password CLI not found"
        log_info "Install with: brew install 1password-cli"
        exit 1
    fi
    
    # Check if signed in
    if ! op account list &> /dev/null; then
        log_warning "Not signed in to 1Password"
        log_info "Sign in with: eval \$(op signin)"
        exit 1
    fi
    
    log_success "1Password CLI is ready"
}

# Create vault if it doesn't exist
create_vault() {
    log_info "Checking if vault '$VAULT_NAME' exists..."
    
    if op vault get "$VAULT_NAME" &> /dev/null; then
        log_success "Vault '$VAULT_NAME' already exists"
    else
        log_info "Creating vault '$VAULT_NAME'..."
        op vault create "$VAULT_NAME" --description "Secrets for X-manage-app development"
        log_success "Created vault '$VAULT_NAME'"
    fi
}

# Store secrets in 1Password
store_secrets() {
    log_info "Storing secrets in 1Password..."
    
    # Database secrets
    op item create --category=login --title="X-manage Database" \
        --vault="$VAULT_NAME" \
        --url="turso.tech" \
        username="database" \
        password="your-turso-auth-token" \
        --notes="Turso database authentication token" \
        2>/dev/null || log_warning "Database item may already exist"
    
    # Google OAuth
    op item create --category=login --title="Google OAuth" \
        --vault="$VAULT_NAME" \
        --url="console.cloud.google.com" \
        username="your-google-client-id" \
        password="your-google-client-secret" \
        --notes="Google OAuth credentials for authentication" \
        2>/dev/null || log_warning "Google OAuth item may already exist"
    
    # X API
    op item create --category=login --title="X API" \
        --vault="$VAULT_NAME" \
        --url="developer.twitter.com" \
        username="your-x-api-key" \
        password="your-x-api-secret" \
        --notes="X API credentials" \
        2>/dev/null || log_warning "X API item may already exist"
    
    # Add custom field for bearer token
    op item edit "X API" --vault="$VAULT_NAME" \
        "bearer_token[password]=your-x-bearer-token" \
        2>/dev/null || log_warning "Could not add bearer token field"
    
    # Better Auth secret
    BETTER_AUTH_SECRET=$(openssl rand -base64 32)
    op item create --category=password --title="Better Auth Secret" \
        --vault="$VAULT_NAME" \
        password="$BETTER_AUTH_SECRET" \
        --notes="Generated secret for Better Auth" \
        2>/dev/null || log_warning "Better Auth secret item may already exist"
    
    # Sentry
    op item create --category=login --title="Sentry" \
        --vault="$VAULT_NAME" \
        --url="sentry.io" \
        username="your-sentry-org" \
        password="your-sentry-auth-token" \
        --notes="Sentry monitoring credentials" \
        2>/dev/null || log_warning "Sentry item may already exist"
    
    # Add custom fields for DSNs
    op item edit "Sentry" --vault="$VAULT_NAME" \
        "web_dsn[password]=your-web-sentry-dsn" \
        "api_dsn[password]=your-api-sentry-dsn" \
        2>/dev/null || log_warning "Could not add Sentry DSN fields"
    
    # Cloudflare
    op item create --category=login --title="Cloudflare" \
        --vault="$VAULT_NAME" \
        --url="dash.cloudflare.com" \
        username="your-cloudflare-account-id" \
        password="your-cloudflare-api-token" \
        --notes="Cloudflare deployment credentials" \
        2>/dev/null || log_warning "Cloudflare item may already exist"
    
    log_success "Secrets stored in 1Password (update with real values)"
}

# Generate .env.local from 1Password
generate_env() {
    log_info "Generating .env.local from 1Password..."
    
    # Check if items exist
    local missing_items=()
    
    if ! op item get "X-manage Database" --vault="$VAULT_NAME" &> /dev/null; then
        missing_items+=("X-manage Database")
    fi
    
    if ! op item get "Google OAuth" --vault="$VAULT_NAME" &> /dev/null; then
        missing_items+=("Google OAuth")
    fi
    
    if [[ ${#missing_items[@]} -gt 0 ]]; then
        log_error "Missing 1Password items: ${missing_items[*]}"
        log_info "Run '$0 store' first to create the items"
        exit 1
    fi
    
    # Generate .env.local
    cat > .env.local << EOF
# Generated from 1Password on $(date)
# X-manage-app Environment Variables

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

DATABASE_URL="libsql://local.db"
TURSO_DATABASE_URL="$(op read "op://$VAULT_NAME/X-manage Database/website" 2>/dev/null || echo "libsql://your-database.turso.io")"
TURSO_AUTH_TOKEN="$(op read "op://$VAULT_NAME/X-manage Database/password" 2>/dev/null || echo "your-turso-token")"

# =============================================================================
# AUTHENTICATION
# =============================================================================

BETTER_AUTH_SECRET="$(op read "op://$VAULT_NAME/Better Auth Secret/password" 2>/dev/null || openssl rand -base64 32)"
GOOGLE_CLIENT_ID="$(op read "op://$VAULT_NAME/Google OAuth/username" 2>/dev/null || echo "your-google-client-id")"
GOOGLE_CLIENT_SECRET="$(op read "op://$VAULT_NAME/Google OAuth/password" 2>/dev/null || echo "your-google-client-secret")"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_URL_INTERNAL="http://localhost:3000"

# =============================================================================
# X (TWITTER) API CONFIGURATION
# =============================================================================

X_API_KEY="$(op read "op://$VAULT_NAME/X API/username" 2>/dev/null || echo "your-x-api-key")"
X_API_SECRET="$(op read "op://$VAULT_NAME/X API/password" 2>/dev/null || echo "your-x-api-secret")"
X_BEARER_TOKEN="$(op read "op://$VAULT_NAME/X API/bearer_token" 2>/dev/null || echo "your-x-bearer-token")"

# =============================================================================
# OBSERVABILITY & MONITORING
# =============================================================================

NEXT_PUBLIC_SENTRY_DSN="$(op read "op://$VAULT_NAME/Sentry/web_dsn" 2>/dev/null || echo "your-web-sentry-dsn")"
SENTRY_API_DSN="$(op read "op://$VAULT_NAME/Sentry/api_dsn" 2>/dev/null || echo "your-api-sentry-dsn")"
SENTRY_ORG="$(op read "op://$VAULT_NAME/Sentry/username" 2>/dev/null || echo "your-sentry-org")"
SENTRY_PROJECT_WEB="x-manage-web"
SENTRY_PROJECT_API="x-manage-api"

# =============================================================================
# CLOUDFLARE CONFIGURATION
# =============================================================================

CLOUDFLARE_API_TOKEN="$(op read "op://$VAULT_NAME/Cloudflare/password" 2>/dev/null || echo "your-cloudflare-api-token")"
CLOUDFLARE_ACCOUNT_ID="$(op read "op://$VAULT_NAME/Cloudflare/username" 2>/dev/null || echo "your-cloudflare-account-id")"

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================

NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:8787"
API_URL="http://localhost:8787"
EOF

    log_success "Generated .env.local from 1Password"
    log_info "Make sure to update the 1Password items with your actual values"
}

# List all items in the vault
list_secrets() {
    log_info "Secrets in vault '$VAULT_NAME':"
    op item list --vault="$VAULT_NAME" --format=table
}

# Show help
show_help() {
    echo "1Password Integration Script for X-manage-app"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup       Create vault and store template secrets"
    echo "  store       Store template secrets in 1Password"
    echo "  generate    Generate .env.local from 1Password secrets"
    echo "  list        List all secrets in the vault"
    echo "  help        Show this help message"
    echo ""
    echo "Setup workflow:"
    echo "  1. $0 setup              # Create vault and template items"
    echo "  2. Edit items in 1Password app with real values"
    echo "  3. $0 generate           # Generate .env.local from 1Password"
    echo ""
    echo "Configuration:"
    echo "  VAULT_NAME: $VAULT_NAME"
}

# Main script logic
main() {
    check_1password
    
    case "${1:-help}" in
        "setup")
            create_vault
            store_secrets
            log_info "Next steps:"
            log_info "1. Open 1Password and edit the items with your real values"
            log_info "2. Run '$0 generate' to create .env.local"
            ;;
        "store")
            create_vault
            store_secrets
            ;;
        "generate")
            generate_env
            ;;
        "list")
            list_secrets
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
