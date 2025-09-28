---
name: Milestone M0 - Project Bootstrap
about: Track tasks for M0 milestone (1-2 days)
title: '[M0] '
labels: milestone-m0, enhancement
assignees: ''

---

## Milestone M0 — Project Bootstrap (1–2 days)

### Tasks

- [ ] Initialize repo with pnpm and workspaces
- [ ] Scaffold `apps/web` (Next.js, TypeScript, App Router)
- [ ] Configure Tailwind v4 and shadcn/ui (install base components)
- [ ] Scaffold `apps/api` (Hono on Cloudflare Workers)
- [ ] Add Drizzle ORM, set up Turso connection (prod) and libSQL dev instance
- [ ] ESLint 9 configured; basic rules + TypeScript
- [ ] Sentry SDK setup (DSNs via secrets)
- [ ] GitHub Actions: lint, type-check, build
- [ ] Configure Vitest with an initial unit test and coverage script
- [ ] Configure Playwright (or equivalent) with an auth flow smoke test placeholder
- [ ] Add `pnpm test`, `pnpm test:unit`, and `pnpm test:e2e` scripts to the workspace

### Iteration Success Criteria

- [ ] `pnpm i && pnpm -w build` succeeds
- [ ] `/` renders with basic TRON-toned UI
- [ ] API health endpoint responds from Workers
- [ ] Vitest and Playwright smoke tests run locally and in CI

### Definition of Done

- All tasks completed and checked off
- Success criteria met and verified
- No critical linter errors
- Documentation updated where necessary

### Estimated Time
1-2 days

### Priority
High - Blocking for all subsequent milestones
