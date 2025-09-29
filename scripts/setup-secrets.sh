#!/bin/bash

# X-manage-app Secrets Setup Script
# This script helps set up secrets for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install missing dependencies and try again"
        exit 1
    fi
    
    log_success "All dependencies found"
}

# Generate secure random secrets
generate_secrets() {
    log_info "Generating secure secrets..."
    
    # Generate Better Auth secret (32 bytes, base64 encoded)
    BETTER_AUTH_SECRET=$(openssl rand -base64 32)
    log_success "Generated Better Auth secret"
    
    # Generate test API keys
    TEST_API_KEY=$(openssl rand -hex 16)
    TEST_API_SECRET=$(openssl rand -hex 32)
    log_success "Generated test API keys"
}

# Setup development environment
setup_development() {
    log_info "Setting up development environment..."
    
    if [[ ! -f .env.example ]]; then
        log_error ".env.example not found. Please ensure you're in the project root."
        exit 1
    fi
    
    if [[ -f .env.local ]]; then
        log_warning ".env.local already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping .env.local creation"
            return
        fi
    fi
    
    # Copy template and replace placeholders
    cp .env.example .env.local
    
    # Replace generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-better-auth-secret-key/$BETTER_AUTH_SECRET/g" .env.local
    else
        # Linux
        sed -i "s/your-better-auth-secret-key/$BETTER_AUTH_SECRET/g" .env.local
    fi
    
    log_success "Created .env.local with generated secrets"
    log_warning "Please edit .env.local and fill in your actual API keys and database URLs"
}

# Validate secrets
validate_secrets() {
    log_info "Validating secrets..."
    
    if [[ ! -f .env.local ]]; then
        log_error ".env.local not found. Run setup first."
        return 1
    fi
    
    # Source the environment file
    set -a
    source .env.local
    set +a
    
    local validation_failed=false
    
    # Check required variables
    required_vars=(
        "DATABASE_URL"
        "BETTER_AUTH_SECRET"
        "GOOGLE_CLIENT_ID"
        "GOOGLE_CLIENT_SECRET"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" || "${!var}" == *"your-"* ]]; then
            log_error "$var is not set or still contains placeholder value"
            validation_failed=true
        else
            log_success "$var is configured"
        fi
    done
    
    # Test database connection (if turso CLI is available)
    if command -v turso &> /dev/null && [[ -n "$TURSO_DATABASE_URL" && "$TURSO_DATABASE_URL" != *"your-"* ]]; then
        if turso db show "$TURSO_DATABASE_URL" &> /dev/null; then
            log_success "Turso database connection valid"
        else
            log_warning "Turso database connection failed (check TURSO_AUTH_TOKEN)"
        fi
    fi
    
    # Test X API (if bearer token is set)
    if [[ -n "$X_BEARER_TOKEN" && "$X_BEARER_TOKEN" != *"your-"* ]]; then
        if curl -s -H "Authorization: Bearer $X_BEARER_TOKEN" \
           "https://api.twitter.com/2/users/me" > /dev/null; then
            log_success "X API connection valid"
        else
            log_warning "X API connection failed (check X_BEARER_TOKEN)"
        fi
    fi
    
    if [[ "$validation_failed" == true ]]; then
        log_error "Validation failed. Please check your .env.local file."
        return 1
    else
        log_success "All secrets validated successfully"
        return 0
    fi
}

# Setup Cloudflare Workers secrets
setup_cloudflare() {
    log_info "Setting up Cloudflare Workers secrets..."
    
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found. Install with: npm install -g wrangler"
        exit 1
    fi
    
    # Check if logged in
    if ! wrangler whoami &> /dev/null; then
        log_warning "Not logged in to Cloudflare. Please run: wrangler login"
        exit 1
    fi
    
    # Source environment variables
    if [[ -f .env.local ]]; then
        set -a
        source .env.local
        set +a
    else
        log_error ".env.local not found. Run setup first."
        exit 1
    fi
    
    # Set secrets for production environment
    local secrets=(
        "DATABASE_URL"
        "TURSO_AUTH_TOKEN"
        "X_API_KEY"
        "X_API_SECRET"
        "X_BEARER_TOKEN"
        "BETTER_AUTH_SECRET"
        "SENTRY_API_DSN"
    )
    
    for secret in "${secrets[@]}"; do
        if [[ -n "${!secret}" && "${!secret}" != *"your-"* ]]; then
            echo "${!secret}" | wrangler secret put "$secret" --env production
            log_success "Set $secret for production"
        else
            log_warning "Skipping $secret (not configured or placeholder value)"
        fi
    done
}

# Show help
show_help() {
    echo "X-manage-app Secrets Setup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup       Set up development environment (.env.local)"
    echo "  validate    Validate current secrets configuration"
    echo "  cloudflare  Set up Cloudflare Workers secrets"
    echo "  generate    Generate new random secrets"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup              # Set up development environment"
    echo "  $0 validate           # Check if secrets are properly configured"
    echo "  $0 cloudflare         # Deploy secrets to Cloudflare Workers"
}

# Main script logic
main() {
    case "${1:-setup}" in
        "setup")
            check_dependencies
            generate_secrets
            setup_development
            log_info "Next steps:"
            log_info "1. Edit .env.local with your actual API keys"
            log_info "2. Run '$0 validate' to check configuration"
            ;;
        "validate")
            validate_secrets
            ;;
        "cloudflare")
            setup_cloudflare
            ;;
        "generate")
            generate_secrets
            echo "Generated secrets:"
            echo "BETTER_AUTH_SECRET=\"$BETTER_AUTH_SECRET\""
            echo "TEST_API_KEY=\"$TEST_API_KEY\""
            echo "TEST_API_SECRET=\"$TEST_API_SECRET\""
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
