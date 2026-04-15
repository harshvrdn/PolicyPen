# PolicyPen — Cursor Agent Rules
# Place this file at: .cursor/rules

## Project
PolicyPen is a SaaS that generates legal/policy documents from user prompts using AI.
Solo founder. Optimize for shipping speed and clean architecture over perfection.

---

## Stack
- **Framework**: Next.js 14 (App Router), TypeScript — strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (Postgres + Auth — email/password)
- **Payments**: Stripe (subscriptions)
- **AI**: Anthropic Claude API (document generation)
- **Deploy**: Vercel

---

## Project Structure
```
/app
  /(auth)/          — login, signup, password reset pages
  /(dashboard)/     — protected routes (documents, editor, settings)
  /api/             — all API route handlers
/components
  /ui/              — shadcn primitives only
  /shared/          — reusable app-level components
  /editor/          — document editor components
/lib
  /supabase.ts      — Supabase client (singleton)
  /stripe.ts        — Stripe client
  /anthropic.ts     — Claude API client
  /utils.ts         — shared utilities
/types
  /index.ts         — all shared TypeScript types
```

---

## Coding Conventions

### General
- Always use TypeScript — no `any` types, define proper interfaces in `/types`
- Use server components by default; add `"use client"` only when needed
- All environment variables via `process.env` — never hardcode
- Handle all errors explicitly — no silent failures, no empty catch blocks

### API Routes (`/app/api/`)
- Every route must validate input before processing
- Return consistent shape: `{ data, error }` — never raw values
- Use try/catch on every async operation
- Rate limit AI generation endpoints

### Supabase
- All DB calls go through `/lib/supabase.ts`
- Always check auth session server-side before DB operations
- Use Row Level Security (RLS) — never bypass it
- Table naming: `snake_case` (documents, user_profiles, subscriptions)

### AI / Document Generation
- Claude API calls go through `/lib/anthropic.ts` only
- Always stream responses for document generation (UX requirement)
- Prompts live in `/lib/prompts/` as named exports — never inline
- Log generation requests with user_id + timestamp for billing

### Components
- Keep components under 150 lines — extract if larger
- Props interfaces defined above each component, not inline
- Loading + error states required on every data-fetching component
- Use shadcn/ui primitives before building custom components

---

## Agent Behavior Rules
- Before editing: list the files you'll touch and why
- After major changes: check for TypeScript errors
- Never delete existing working code — refactor or extend
- Never modify `/app/(auth)/` — auth flow is complete
- Prefer existing patterns in codebase over introducing new ones
- When adding a feature, also add the corresponding TypeScript type
- If a task requires more than 5 files, ask for confirmation first

---

## What PolicyPen Is NOT
- Not a legal advice tool — generated documents are templates only
- Not a real-time collaboration tool (no websockets needed)
- Not a mobile app — desktop-first, responsive second

---

## Priorities (in order)
1. Document generation pipeline (core value)
2. Auth + subscription gating
3. Document history + management
4. Export (PDF, DOCX)
5. Polish + onboarding
