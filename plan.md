# X-manage-app — Implementation Plan

A pragmatic, iterative plan to build a web app for managing X (formerly Twitter) posts, aligned with the stack and constraints in `README.md`. Each milestone is shippable and includes checkable tasks, acceptance criteria, and open questions.

## Guiding Principles

- Keep iterations small and shippable.
- Favor edge-ready solutions (Cloudflare) and type-safety.
- Instrument early (Sentry) and test the core flows (unit + e2e).

---

## Project Kickoff To-Do

- [ ] Finalize environment choices (Cloudflare Pages/Workers, Postgres provider, Sentry project) and capture credentials
- [ ] Create GitHub repository with pnpm workspaces and push the initial plan files
- [ ] Open GitHub Issues for Milestone M0 tasks and assign owners/due dates
- [ ] Prepare shared secrets management strategy (development vs production) and document in `README.md`
- [ ] Schedule daily X data sync cron window and confirm rate-limit guardrails with API keys
- [ ] Align on analytics scope and backfill window to unblock Drizzle schema definitions

---

## Architecture (High-level)

- Frontend: Next.js (App Router) + React, Tailwind CSS v4, shadcn/ui.
- Backend API: Hono (edge), deployed to Cloudflare Workers.
- Authentication: Better Auth (formerly Auth.js/NextAuth) for Google OAuth and email links.
- Database: Postgres (managed: e.g., Neon/Supabase). ORM: Drizzle.
- Job/Scheduling: Cloudflare Cron Triggers → Hono job route.
- Observability: Sentry for frontend and backend.
- Hosting: Cloudflare Pages for Next.js; Cloudflare Workers for API.
- CI/CD: GitHub Actions + pnpm.

Suggested repository layout (monorepo with pnpm workspaces):

```
.
├─ apps/
│  ├─ web/            # Next.js front-end
│  └─ api/            # Hono (Workers) back-end
├─ packages/
│  └─ ui/             # (optional) shared UI theme/components
├─ drizzle/           # migrations and schema
├─ .github/workflows/ # CI/CD
└─ plan.md
```

---

## Data Model (initial cut)

- users: local app users
- accounts: OAuth provider links (Google/email) to users
- sessions: sessions (if needed by chosen auth lib)
- x_accounts: connected X accounts per user
- x_tokens: OAuth tokens/refresh for X
- x_posts: posts/tweets we manage/track
- x_post_metrics: time-series metrics (impressions, likes, reposts, replies, bookmarks, profile_clicks, link_clicks)
- x_sync_jobs: sync runs and results

Note: prefer narrow write models and append-only metric series to preserve history.

---

## Milestone M0 — Project Bootstrap (1–2 days)

Tasks

- [ ] Initialize repo with pnpm and workspaces
- [ ] Scaffold `apps/web` (Next.js, TypeScript, App Router)
- [ ] Configure Tailwind v4 and shadcn/ui (install base components)
- [ ] Scaffold `apps/api` (Hono on Cloudflare Workers)
- [ ] Add Drizzle ORM, set up Postgres connection (Neon/Supabase)
- [ ] ESLint 9 configured; basic rules + TypeScript
- [ ] Sentry SDK setup (DSNs via secrets)
- [ ] GitHub Actions: lint, type-check, build
- [ ] Configure Vitest with an initial unit test and coverage script
- [ ] Configure Playwright (or equivalent) with an auth flow smoke test placeholder
- [ ] Add `pnpm test`, `pnpm test:unit`, and `pnpm test:e2e` scripts to the workspace

Iteration Success

- [ ] `pnpm i && pnpm -w build` succeeds
- [ ] `/` renders with basic TRON-toned UI
- [ ] API health endpoint responds from Workers
- [ ] Vitest and Playwright smoke tests run locally and in CI

---

## Milestone M1 — Authentication (2–4 days)

Approach

- Use Better Auth (the successor to Auth.js/NextAuth) in `apps/web` for Google OAuth and/or email magic links.
- Persist users/accounts/sessions in Postgres via Drizzle.

Tasks

- [ ] Configure Google OAuth (client id/secret)
- [ ] Configure email magic link (provider or SMTP)
- [ ] Create Drizzle schema: users, accounts, sessions
- [ ] Protect app routes; add sign-in/out UI
- [ ] E2E test: sign-in flow (Playwright)
- [ ] Expand unit tests around auth callbacks and session persistence

Iteration Success

- [ ] Users authenticate via Google (and/or email) without passwords
- [ ] User row is persisted; session re-validates on refresh
- [ ] Auth unit and E2E tests cover happy path and failure cases in CI

---

## Milestone M2 — Connect X Account (3–5 days)

Approach

- Implement X OAuth 2.0 flow (or 1.0a if required by scope) via backend `apps/api`.
- Store tokens securely in `x_tokens` (encrypted at rest on the DB side or via KMS if available).

Tasks

- [ ] Obtain X API keys and set secrets in CI and Workers
- [ ] Implement connect/disconnect endpoints in Hono
- [ ] UI: button to connect X account; shows connected handle
- [ ] Persist `x_accounts` and `x_tokens` (with refresh, expiry)
- [ ] E2E test: user connects and sees account status
- [ ] Unit tests for token storage, refresh handling, and revoke flows

Iteration Success

- [ ] A signed-in user can connect their X account and later disconnect
- [ ] Tokens refresh automatically when expired
- [ ] Token lifecycle tests (unit + E2E) pass in CI and cover reconnect scenarios

---

## Milestone M3 — Analytics Ingestion (4–7 days)

Approach

- Fetch posts and metrics from X API v2.
- Store canonical post rows in `x_posts`; append metric snapshots in `x_post_metrics`.
- Schedule periodic sync via Cloudflare Cron Triggers to a Hono route.

Tasks

- [ ] Define Drizzle schema: x_posts, x_post_metrics, x_sync_jobs
- [ ] Implement `syncPosts` job (manual trigger + cron)
- [ ] Backfill last 30–90 days on first connect
- [ ] Unit tests: mapping, upsert logic, metric merging
- [ ] Basic rate limiting/retry with jitter
- [ ] Schedule a daily Cloudflare Cron Trigger for the sync job
- [ ] Add integration test (mock X API) to verify daily sync contract

Iteration Success

- [ ] First sync completes and persists posts + metrics
- [ ] Subsequent syncs only add delta metrics; no duplicates
- [ ] Daily scheduled sync runs successfully with monitoring hooks in place
- [ ] Ingestion unit/integration tests cover mapping, dedupe, and failure retries

---

## Milestone M4 — Manage & View Posts (3–6 days)

Approach

- Minimal, fast UI to browse, filter, and inspect posts and metrics.
- Optional stretch: draft and publish new posts later.

Tasks

- [ ] List view of posts with key metrics columns
- [ ] Filters (date range, type, min impressions/engagement)
- [ ] Detail drawer/page with metric timeline and raw payload
- [ ] shadcn/ui components themed with TRON tones
- [ ] E2E test: browse, filter, open details
- [ ] Component/unit tests for metric cards, filters, and data transforms
- [ ] Optional visual regression snapshots for key views (Chromium)

Iteration Success

- [ ] A user can view their posts and key metrics reliably with filters applied
- [ ] Filtering and detail view perform within acceptable performance thresholds
- [ ] Frontend unit/E2E tests validate list, filter, and detail flows in CI

---

## Milestone M5 — Hardening, Observability, and CI/CD (2–4 days)

Tasks

- [ ] Sentry tracing + error boundaries (web) and middleware (api)
- [ ] GitHub Actions: test matrix (unit + e2e), preview deploys
- [ ] Secrets management documented; rotate tokens
- [ ] 429/5xx handling and exponential backoff where applicable
- [ ] Basic access logging/structured logs in Workers
- [ ] Docs: update `README.md` with runbooks
- [ ] Add coverage thresholds and reporting to CI
- [ ] Expand Playwright suite for regression-critical journeys
- [ ] Add synthetic monitoring (scheduled E2E run) for daily sync and auth

Iteration Success

- [ ] CI blocks merges on lint, type-check, tests
- [ ] Meaningful Sentry traces/errors visible
- [ ] Coverage and test status gates enforce quality before deploy
- [ ] Daily sync job and core flows are observable via Sentry/logs/monitoring

---

## Testing Strategy

- Unit: business logic (ingestion, mapping, reducers) with Vitest.
- Integration: API handlers with in-memory/mocked Postgres and MSW for X API.
- E2E: Playwright covering auth, connect X, daily sync validation, browse posts.

---

## Deployment Strategy

- Environments: `preview` (per PR), `staging`, `production`.
- Cloudflare Pages for `apps/web` (Next.js functions if needed).
- Cloudflare Workers for `apps/api` with separate routes and cron triggers.
- Postgres via managed provider (Neon/Supabase); migrations via Drizzle.

---

## Open Questions (need owner decision)

- Single vs multiple X accounts per app user?
- Exact analytics needed (impressions, likes, reposts, replies, bookmarks, link clicks, profile clicks)?
- Backfill window (30/60/90 days)?
- Email auth required, or is Google-only acceptable for v1?
- Data retention policy and export/deletion requirements?
- Regional data residency needs?

---

## Definition of Done (DoD)

- All milestone acceptance criteria met
- No critical Sentry errors for 7 days post-release
- e2e suite green, core P95 < 500ms for primary views
- Documentation updated (README, runbooks)

---

## How to Use This Plan

- Treat each milestone as a GitHub Milestone with issues per task.
- Check items here as they are completed to keep a single-source to-do list.
