#!/bin/bash

# Test workflow script for X-manage-app
# This script provides convenient commands for running tests and git operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to run pre-commit checks
precommit_check() {
    print_status "Running pre-commit checks..."
    
    print_status "Step 1/3: Linting..."
    if pnpm lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
    
    print_status "Step 2/3: Type checking..."
    if pnpm type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        exit 1
    fi
    
    print_status "Step 3/3: Running tests..."
    if pnpm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
    
    print_success "All pre-commit checks passed! 🚀"
}

# Function to run tests with different options
run_tests() {
    case $1 in
        "watch")
            print_status "Running tests in watch mode..."
            pnpm test:watch
            ;;
        "coverage")
            print_status "Running tests with coverage..."
            pnpm test:coverage
            ;;
        "web")
            print_status "Running web tests only..."
            cd apps/web && npm test
            ;;
        "api")
            print_status "Running API tests only..."
            cd apps/api && npm test
            ;;
        *)
            print_status "Running all tests..."
            pnpm test
            ;;
    esac
}

# Function to help with git workflow
git_workflow() {
    case $1 in
        "new")
            if [ -z "$2" ]; then
                print_error "Please provide a branch name"
                echo "Usage: $0 git new feature/my-feature"
                exit 1
            fi
            print_status "Creating new branch: $2"
            git checkout main
            git pull origin main
            git checkout -b "$2"
            print_success "Branch $2 created and checked out"
            ;;
        "commit")
            if [ -z "$2" ]; then
                print_error "Please provide a commit message"
                echo "Usage: $0 git commit 'feat(web): add new feature'"
                exit 1
            fi
            precommit_check
            print_status "Committing changes..."
            git add .
            git commit -m "$2"
            print_success "Changes committed successfully"
            ;;
        "push")
            branch=$(git branch --show-current)
            print_status "Pushing branch: $branch"
            git push origin "$branch"
            print_success "Branch pushed successfully"
            print_warning "Don't forget to create a PR!"
            ;;
        "cleanup")
            print_status "Cleaning up merged branches..."
            git checkout main
            git pull origin main
            git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d
            print_success "Cleanup completed"
            ;;
        *)
            print_error "Unknown git command: $1"
            echo "Available commands: new, commit, push, cleanup"
            exit 1
            ;;
    esac
}

# Main script logic
case $1 in
    "precommit"|"pre-commit")
        precommit_check
        ;;
    "test")
        run_tests "$2"
        ;;
    "git")
        git_workflow "$2" "$3"
        ;;
    "help"|"--help"|"-h")
        echo "X-manage-app Test & Git Workflow Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  precommit                Run pre-commit checks (lint, type-check, test)"
        echo "  test [option]           Run tests"
        echo "    - test                 Run all tests"
        echo "    - test watch          Run tests in watch mode"
        echo "    - test coverage       Run tests with coverage"
        echo "    - test web            Run web tests only"
        echo "    - test api            Run API tests only"
        echo "  git <command>           Git workflow helpers"
        echo "    - git new <branch>    Create and checkout new branch"
        echo "    - git commit <msg>    Run checks and commit"
        echo "    - git push            Push current branch"
        echo "    - git cleanup         Clean up merged branches"
        echo "  help                    Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 precommit"
        echo "  $0 test watch"
        echo "  $0 git new feature/settings-page"
        echo "  $0 git commit 'feat(web): add settings page'"
        echo "  $0 git push"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' to see available commands"
        exit 1
        ;;
esac
