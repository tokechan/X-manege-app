#!/bin/bash

# M0 Milestone Issues作成スクリプト
# GitHub CLIを使用してMilestone M0のIssueを自動作成

set -e

echo "🚀 Creating Milestone M0 Issues..."

# リポジトリ情報を取得
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Repository: $REPO"

# Milestoneを作成（既に存在する場合はスキップ）
echo "📋 Creating Milestone M0..."
gh api repos/$REPO/milestones \
  --method POST \
  --field title="Milestone M0 - Project Bootstrap" \
  --field description="Basic project setup and tooling (1-2 days)" \
  --field state="open" \
  2>/dev/null || echo "   ℹ️  Milestone may already exist"

# Issue 1: pnpm workspaces初期化
echo "📝 Creating Issue 1: Initialize pnpm workspaces..."
gh issue create \
  --title "[M0] Initialize repo with pnpm and workspaces" \
  --body "Set up the basic monorepo structure with pnpm workspaces.

**Acceptance Criteria:**
- [ ] pnpm-workspace.yaml configured
- [ ] Root package.json with workspace scripts  
- [ ] Apps and packages directories created
- [ ] Basic .gitignore in place

**Technical Notes:**
- Follow the structure defined in plan.md
- Ensure workspace scripts work across all packages

**Estimated Time:** 2-4 hours
**Priority:** High - Blocking" \
  --label "milestone-m0,setup,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# Issue 2: Next.js Webアプリスキャフォールド
echo "📝 Creating Issue 2: Scaffold Next.js web app..."
gh issue create \
  --title "[M0] Scaffold apps/web (Next.js, TypeScript, App Router)" \
  --body "Create the Next.js frontend application with TypeScript and App Router.

**Acceptance Criteria:**
- [ ] Next.js 14+ with App Router configured
- [ ] TypeScript strict mode enabled
- [ ] Basic page structure created
- [ ] Development server runs successfully
- [ ] Package.json with dev scripts configured

**Technical Notes:**
- Use latest Next.js with App Router
- Configure for Cloudflare Pages deployment
- Set up TypeScript with strict mode

**Estimated Time:** 3-4 hours
**Priority:** High" \
  --label "milestone-m0,frontend,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# Issue 3: Tailwind v4 & shadcn/ui設定
echo "📝 Creating Issue 3: Configure Tailwind v4 and shadcn/ui..."
gh issue create \
  --title "[M0] Configure Tailwind v4 and shadcn/ui base components" \
  --body "Set up styling system with Tailwind v4 and shadcn/ui components.

**Acceptance Criteria:**
- [ ] Tailwind CSS v4 installed and configured
- [ ] shadcn/ui CLI set up
- [ ] Base components installed (Button, Card, Input, etc.)
- [ ] TRON color theme configured in tailwind.config
- [ ] Basic styled homepage renders with TRON theme

**Technical Notes:**
- Use TRON-inspired color palette (dark blues, cyans, electric blues)
- Install essential shadcn/ui components for forms and layout
- Configure CSS variables for theme colors

**Estimated Time:** 4-5 hours
**Priority:** High" \
  --label "milestone-m0,frontend,styling,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# Issue 4: Hono API スキャフォールド
echo "📝 Creating Issue 4: Scaffold Hono API..."
gh issue create \
  --title "[M0] Scaffold apps/api (Hono on Cloudflare Workers)" \
  --body "Create the Hono-based API that will run on Cloudflare Workers.

**Acceptance Criteria:**
- [ ] Hono app structure created in apps/api
- [ ] TypeScript configuration for Workers
- [ ] Health check endpoint (/health) implemented
- [ ] Wrangler configuration for local dev
- [ ] Basic CORS and security middleware setup
- [ ] Local dev server runs successfully

**Technical Notes:**
- Configure for Cloudflare Workers deployment
- Set up local development with 'wrangler dev'
- Add proper TypeScript types for Workers environment

**Estimated Time:** 3-4 hours
**Priority:** High" \
  --label "milestone-m0,backend,api,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# Issue 5: Drizzle ORM & データベース設定
echo "📝 Creating Issue 5: Set up Drizzle ORM and database..."
gh issue create \
  --title "[M0] Add Drizzle ORM and Turso/libSQL setup" \
  --body "Configure Drizzle ORM with Turso for production and libSQL for development.

**Acceptance Criteria:**
- [ ] Drizzle ORM installed and configured
- [ ] Turso production database connection configured
- [ ] Local libSQL development setup working
- [ ] Migration system configured with drizzle-kit
- [ ] Basic schema structure defined (users table as example)
- [ ] Database connection test passes

**Technical Notes:**
- Use Turso for production database (managed libSQL)
- Set up local development with libSQL or Docker
- Configure drizzle-kit for schema migrations
- Add environment variables for database URLs

**Estimated Time:** 4-6 hours
**Priority:** High - Needed for auth setup" \
  --label "milestone-m0,backend,database,high-priority" \
  --milestone "Milestone M0 - Project Bootstrap"

# Issue 6: ESLint 9 & TypeScript設定
echo "📝 Creating Issue 6: Configure ESLint 9 and TypeScript..."
gh issue create \
  --title "[M0] Configure ESLint 9 and TypeScript strict mode" \
  --body "Set up linting and type checking across the monorepo.

**Acceptance Criteria:**
- [ ] ESLint 9 configured with TypeScript support
- [ ] Strict TypeScript configuration in all packages
- [ ] Shared ESLint config for consistency
- [ ] Lint scripts in package.json work
- [ ] Type checking passes in all packages

**Technical Notes:**
- Use ESLint 9 flat config format
- Configure rules for React, Node.js, and general TypeScript
- Set up workspace-level shared configurations

**Estimated Time:** 2-3 hours
**Priority:** Medium" \
  --label "milestone-m0,tooling,linting" \
  --milestone "Milestone M0 - Project Bootstrap"

echo "✅ All M0 Issues created successfully!"
echo "🔗 View issues: gh issue list --milestone 'Milestone M0 - Project Bootstrap'"
