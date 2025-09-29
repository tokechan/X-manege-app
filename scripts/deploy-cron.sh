#!/bin/bash

# Deploy Cloudflare Workers with Cron Triggers
# This script deploys the API worker and sets up cron triggers

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

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI not found"
        log_info "Install with: npm install -g wrangler"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm not found"
        log_info "Install with: npm install -g pnpm"
        exit 1
    fi
    
    log_success "All dependencies found"
}

# Check authentication
check_auth() {
    log_info "Checking Cloudflare authentication..."
    
    if ! wrangler whoami &> /dev/null; then
        log_error "Not authenticated with Cloudflare"
        log_info "Run: wrangler login"
        exit 1
    fi
    
    local user=$(wrangler whoami 2>/dev/null | grep "You are logged in as" | cut -d' ' -f6)
    log_success "Authenticated as: $user"
}

# Deploy to specific environment
deploy_environment() {
    local env=$1
    log_info "Deploying to $env environment..."
    
    cd apps/api
    
    # Install dependencies
    if [[ ! -d node_modules ]]; then
        log_info "Installing dependencies..."
        pnpm install
    fi
    
    # Deploy with wrangler
    if [[ "$env" == "production" ]]; then
        wrangler deploy --env production
    elif [[ "$env" == "staging" ]]; then
        wrangler deploy --env staging
    else
        wrangler deploy --env development
    fi
    
    cd ../..
    log_success "Deployed to $env"
}

# Set up secrets for environment
setup_secrets() {
    local env=$1
    log_info "Setting up secrets for $env..."
    
    cd apps/api
    
    # Check if .env.local exists
    if [[ ! -f ../../.env.local ]]; then
        log_error ".env.local not found"
        log_info "Run: pnpm secrets:setup"
        exit 1
    fi
    
    # Source environment variables
    set -a
    source ../../.env.local
    set +a
    
    # Set secrets
    local secrets=(
        "DATABASE_URL"
        "TURSO_AUTH_TOKEN"
        "X_API_KEY"
        "X_API_SECRET"
        "X_BEARER_TOKEN"
        "SENTRY_API_DSN"
    )
    
    for secret in "${secrets[@]}"; do
        if [[ -n "${!secret}" && "${!secret}" != *"your-"* ]]; then
            echo "${!secret}" | wrangler secret put "$secret" --env "$env"
            log_success "Set secret: $secret"
        else
            log_warning "Skipping $secret (not configured)"
        fi
    done
    
    cd ../..
}

# Verify cron triggers
verify_cron() {
    local env=$1
    log_info "Verifying cron triggers for $env..."
    
    cd apps/api
    
    # List cron triggers
    local cron_output=$(wrangler cron trigger --env "$env" 2>&1 || true)
    
    if echo "$cron_output" | grep -q "30 2 \* \* \*"; then
        log_success "Daily sync cron trigger configured"
    else
        log_warning "Daily sync cron trigger not found"
    fi
    
    if echo "$cron_output" | grep -q "0 \*/6 \* \* \*"; then
        log_success "Health check cron trigger configured"
    else
        log_warning "Health check cron trigger not found"
    fi
    
    cd ../..
}

# Test deployment
test_deployment() {
    local env=$1
    log_info "Testing deployment for $env..."
    
    # Get worker URL
    local worker_url
    case "$env" in
        "production")
            worker_url="https://api.x-manage.app"
            ;;
        "staging")
            worker_url="https://api-staging.x-manage.app"
            ;;
        *)
            worker_url="https://x-manage-api-dev.your-subdomain.workers.dev"
            ;;
    esac
    
    # Test health endpoint
    if curl -s "$worker_url/health" | grep -q "ok"; then
        log_success "Health endpoint responding"
    else
        log_error "Health endpoint not responding"
        return 1
    fi
    
    # Test status endpoint
    if curl -s "$worker_url/status" | grep -q "operational"; then
        log_success "Status endpoint responding"
    else
        log_error "Status endpoint not responding"
        return 1
    fi
    
    log_success "Deployment test passed"
}

# Show help
show_help() {
    echo "Cloudflare Workers Cron Deployment Script"
    echo ""
    echo "Usage: $0 [command] [environment]"
    echo ""
    echo "Commands:"
    echo "  deploy      Deploy worker to specified environment"
    echo "  secrets     Set up secrets for specified environment"
    echo "  test        Test deployment"
    echo "  full        Full deployment (deploy + secrets + test)"
    echo "  help        Show this help message"
    echo ""
    echo "Environments:"
    echo "  development (default)"
    echo "  staging"
    echo "  production"
    echo ""
    echo "Examples:"
    echo "  $0 deploy staging           # Deploy to staging"
    echo "  $0 secrets production       # Set up production secrets"
    echo "  $0 full production          # Full production deployment"
}

# Main script logic
main() {
    local command=${1:-deploy}
    local environment=${2:-development}
    
    case "$command" in
        "deploy")
            check_dependencies
            check_auth
            deploy_environment "$environment"
            verify_cron "$environment"
            ;;
        "secrets")
            check_dependencies
            check_auth
            setup_secrets "$environment"
            ;;
        "test")
            test_deployment "$environment"
            ;;
        "full")
            check_dependencies
            check_auth
            deploy_environment "$environment"
            setup_secrets "$environment"
            verify_cron "$environment"
            test_deployment "$environment"
            log_success "Full deployment completed for $environment"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
