# PolicyPen TODO

Living backlog for building PolicyPen (AI-generated legal policies for SaaS/indie makers).

## How to use this file
- Move items across sections as work progresses.
- Keep tasks small and testable.
- Add acceptance criteria for any non-trivial feature.

## Backlog

### 0) Project foundation
- [ ] Bootstrap Next.js 14 app (App Router) with TypeScript and Tailwind CSS.
- [ ] Add base project scripts (`dev`, `build`, `start`, `lint`, `typecheck`).
- [ ] Configure formatting/linting defaults (ESLint + Prettier or chosen standard).
- [ ] Add `.env.example` with required variables (Supabase, Stripe, app URL).
- [ ] Add initial app layout, metadata, and global styles.

### 1) UI system
- [ ] Initialize shadcn/ui and set component + style conventions.
- [ ] Build reusable layout primitives (container, section, card, form shell).
- [ ] Create top-level pages: landing, generator flow, pricing, auth callback, dashboard.
- [ ] Ensure server components by default; use client components only where interactivity is required.

### 2) Supabase integration (auth + database)
- [ ] Add `lib/supabase.ts` and centralize Supabase client setup.
- [ ] Implement authentication flow (sign up, sign in, sign out, session handling).
- [ ] Define initial database schema for:
  - users / profiles
  - projects (company/product context)
  - generated_documents
  - questionnaire_submissions
  - subscriptions / billing_state
- [ ] Add Row Level Security policies for user-owned data.
- [ ] Add migration workflow for schema changes.

### 3) Questionnaire + generation pipeline
- [ ] Define 2-minute questionnaire fields and validation rules.
- [ ] Build multi-step questionnaire UX with save/resume support.
- [ ] Implement generation service that outputs:
  - Privacy Policy
  - Terms of Service
  - Cookie Policy
  - Refund Policy
- [ ] Add versioning for regenerated documents.
- [ ] Add editable post-generation review flow.

### 4) Stripe billing
- [ ] Add Stripe SDK integration and checkout flow.
- [ ] Define free vs paid limits (e.g., drafts, exports, regeneration count).
- [ ] Handle webhooks for subscription lifecycle updates.
- [ ] Sync billing state into Supabase.
- [ ] Gate premium features based on subscription status.

### 5) Export + delivery
- [ ] Implement document export options (copy, markdown, HTML, PDF if needed).
- [ ] Add hosted policy pages with shareable URLs.
- [ ] Add “last updated” and version history display.
- [ ] Add safe regeneration warnings before overwrite.

### 6) Quality + security
- [ ] Add TypeScript strict mode and run regular type checks.
- [ ] Add automated tests for core paths (auth, questionnaire, generation, billing guards).
- [ ] Add basic E2E tests for happy path document generation.
- [ ] Add server-side input validation + rate limiting for generation endpoints.
- [ ] Add audit logging for generation and billing events.

### 7) Deployment + operations
- [ ] Configure Vercel environments (preview + production).
- [ ] Configure environment variables in Vercel (no hardcoded secrets in code).
- [ ] Add CI checks (lint, typecheck, tests) on pull requests.
- [ ] Add monitoring/error reporting.
- [ ] Add backup and rollback notes for critical data paths.

### 8) Documentation
- [ ] Expand `README.md` with local setup and architecture overview.
- [ ] Add contributor guide (branching, commits, PR checklist).
- [ ] Document Supabase schema and RLS policy rationale.
- [ ] Document Stripe webhook setup and local testing.

## Current focus (recommended order)
1. Bootstrap app foundation.
2. Set up `lib/supabase.ts` + auth.
3. Build questionnaire MVP.
4. Implement generation pipeline MVP.
5. Add Stripe checkout + subscription gating.

## Notes
- Keep components under 150 lines; extract helpers/subcomponents early.
- Use `process.env` for all configuration; never hardcode secrets.
