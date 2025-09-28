# Milestone M0 - GitHub Issues Setup Guide

## Overview

This document provides specific GitHub Issues to create for Milestone M0 tasks with suggested titles, descriptions, and acceptance criteria.

## Issues to Create

### 1. Initialize pnpm workspaces
**Title**: `[M0] Initialize repo with pnpm and workspaces`
**Labels**: `milestone-m0`, `setup`, `high-priority`
**Assignee**: [Your GitHub username]
**Due Date**: Day 1
**Description**:
```
Set up the basic monorepo structure with pnpm workspaces.

**Acceptance Criteria:**
- [ ] pnpm-workspace.yaml configured
- [ ] Root package.json with workspace scripts
- [ ] Apps and packages directories created
- [ ] Basic .gitignore in place

**Technical Notes:**
- Follow the structure defined in plan.md
- Ensure workspace scripts work across all packages
```

### 2. Scaffold Next.js Web App
**Title**: `[M0] Scaffold apps/web (Next.js, TypeScript, App Router)`
**Labels**: `milestone-m0`, `frontend`, `high-priority`
**Assignee**: [Your GitHub username]
**Due Date**: Day 1
**Description**:
```
Create the Next.js frontend application with TypeScript and App Router.

**Acceptance Criteria:**
- [ ] Next.js 14+ with App Router configured
- [ ] TypeScript strict mode enabled
- [ ] Basic page structure created
- [ ] Development server runs successfully

**Technical Notes:**
- Use latest Next.js with App Router
- Configure for Cloudflare Pages deployment
```

### 3. Configure Tailwind v4 and shadcn/ui
**Title**: `[M0] Configure Tailwind v4 and shadcn/ui base components`
**Labels**: `milestone-m0`, `frontend`, `styling`
**Assignee**: [Your GitHub username]
**Due Date**: Day 1
**Description**:
```
Set up styling system with Tailwind v4 and shadcn/ui components.

**Acceptance Criteria:**
- [ ] Tailwind CSS v4 installed and configured
- [ ] shadcn/ui CLI set up
- [ ] Base components installed (Button, Card, etc.)
- [ ] TRON color theme configured
- [ ] Basic styled homepage renders

**Technical Notes:**
- Use TRON-inspired color palette
- Install essential shadcn/ui components
```

### 4. Scaffold Hono API
**Title**: `[M0] Scaffold apps/api (Hono on Cloudflare Workers)`
**Labels**: `milestone-m0`, `backend`, `high-priority`
**Assignee**: [Your GitHub username]
**Due Date**: Day 1-2
**Description**:
```
Create the Hono-based API that will run on Cloudflare Workers.

**Acceptance Criteria:**
- [ ] Hono app structure created
- [ ] TypeScript configuration
- [ ] Health check endpoint implemented
- [ ] Wrangler configuration for local dev
- [ ] Basic CORS and middleware setup

**Technical Notes:**
- Configure for Cloudflare Workers deployment
- Set up local development with wrangler dev
```

### 5. Set up Drizzle ORM and Database
**Title**: `[M0] Add Drizzle ORM and Turso/libSQL setup`
**Labels**: `milestone-m0`, `backend`, `database`
**Assignee**: [Your GitHub username]
**Due Date**: Day 2
**Description**:
```
Configure Drizzle ORM with Turso for production and libSQL for development.

**Acceptance Criteria:**
- [ ] Drizzle ORM installed and configured
- [ ] Turso production database connection
- [ ] Local libSQL development setup
- [ ] Migration system configured
- [ ] Basic schema structure defined

**Technical Notes:**
- Use Turso for production database
- Set up local development with libSQL
- Configure drizzle-kit for migrations
```

## Creating the Issues

1. Go to your GitHub repository
2. Click "Issues" → "New Issue"
3. Use the provided templates and information above
4. Create a "Milestone M0" milestone in GitHub
5. Assign all issues to the M0 milestone
6. Set appropriate due dates (1-2 days from start)

## Tracking Progress

- Update issue status as work progresses
- Check off acceptance criteria items
- Link Pull Requests to issues
- Update plan.md checklist items when tasks complete
