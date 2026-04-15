# PolicyPen TODO

Living backlog for PolicyPen. Updated against the current repository state.

## How to maintain this file
- Mark completed items with `[x]`, active work with `[~]`, and pending work with `[ ]`.
- Keep tasks implementation-sized and testable.
- When adding non-trivial tasks, include a short acceptance note in the item.

## Current status snapshot

### Already implemented
- [x] Next.js + TypeScript project scaffold with npm scripts.
- [x] Supabase helpers split by runtime (`lib/supabase/client.ts`, `server.ts`, `middleware.ts`).
- [x] Auth session refresh middleware wired in `middleware.ts`.
- [x] Core legal generation pipeline (`jurisdiction-router` → `clause-library` → `prompts/builder` → `prompts/generate`).
- [x] Streaming generation API route at `POST /api/generate` with cache logic and Supabase persistence.
- [x] Initial Supabase schema + RLS for `policies` and `law_updates`.
- [x] Policy wizard UI scaffold (`PolicyWizard.jsx`) with multi-step questionnaire and review state.

### Partially implemented / needs follow-up
- [~] `PolicyWizard.jsx` exists but is not wired to real SSE `/api/generate` results yet.
- [~] Documentation exists but is inconsistent (`README.md`, `AGENTS.md`, `CLAUDE.md` disagree in places).
- [~] Supabase typed schema exists, but regeneration workflow after DB changes should be documented and automated.

## Priority backlog

### P0 — Product-critical (next)
- [ ] Wire `PolicyWizard.jsx` to call `POST /api/generate` and render real-time stream chunks + completion payload.
- [ ] Add auth UI routes (login, signup, reset password) and protect generator/dashboard access paths.
- [ ] Add top-level App Router pages and route structure (`/`, `/generate`, auth group, dashboard group).
- [ ] Create `.env.example` with all required variables used by current code.
- [ ] Add request validation in `app/api/generate/route.ts` (strict body schema, required questionnaire keys).

### P1 — Billing + gating
- [ ] Add Stripe integration layer (`lib/stripe.ts`) and checkout flow.
- [ ] Implement `app/api/webhooks/stripe/route.ts` for subscription lifecycle events.
- [ ] Extend schema/types for subscriptions and plan state.
- [ ] Add server-side generation limits/gating (free vs paid) enforced in generation route.

### P1 — Dashboard + document lifecycle
- [ ] Build dashboard views for generated policy history and detail view.
- [ ] Add regenerate/version UX connected to `policies.version`.
- [ ] Add delete/archive actions for user-owned policy records.
- [ ] Add policy metadata UI (tokens, cost, generated time, jurisdictions activated).

### P2 — Quality, security, and reliability
- [ ] Add automated tests for jurisdiction routing, clause activation, and prompt builder output.
- [ ] Add integration tests for `/api/generate` auth + validation + cache behavior.
- [ ] Add rate limiting and abuse protection on generation endpoint.
- [ ] Add structured error handling/logging around Anthropic failures and DB write failures.
- [ ] Add CI pipeline for `lint`, `type-check`, and tests on pull requests.

### P2 — Export and delivery
- [ ] Add document export options (HTML download first; PDF/DOCX later if required).
- [ ] Add publish/share flow for hosted policy pages.
- [ ] Add change history / last-updated visibility in UI.

### P3 — Cleanup and consistency
- [ ] Split `PolicyWizard.jsx` into smaller components (current file is very large).
- [ ] Align naming conventions between `lib/types.ts`, questionnaire fields, and UI labels.
- [ ] Consolidate duplicated project guidance across `README.md`, `AGENTS.md`, and `CLAUDE.md`.

## Suggested working order
1. Wire wizard to real generation endpoint.
2. Implement auth pages and route protection UX.
3. Add dashboard/history for generated documents.
4. Add Stripe billing and subscription gating.
5. Add tests + CI + hardening.

## Ongoing guardrails
- Keep components under ~150 lines where practical; extract subcomponents/hooks early.
- Prefer server components unless client interactivity is required.
- Use `process.env` for all config/secrets; never hardcode secrets.
- Keep Supabase access through `lib/supabase/*` helpers.
