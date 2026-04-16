# AGENTS.md

## Cursor Cloud specific instructions

### Repository overview

**PolicyPen** — AI-powered legal document generator SaaS.  
Generates legally-structured Privacy Policy, Terms of Service, Cookie Policy, and Refund Policy pages for SaaS products and indie makers — instantly, from a 2-minute questionnaire.

---

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js **15.1.4** (App Router), TypeScript strict mode |
| Styling | Tailwind CSS + shadcn/ui |
| Auth + Database | Supabase (`@supabase/ssr`) |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`, model `claude-sonnet-4-20250514`) |
| Payments | Stripe *(not yet wired — env vars ready)* |
| Deploy | Vercel |
| Package manager | **npm** (`package-lock.json` is the lockfile — do not use pnpm/yarn) |

---

### Current build status

| Area | Status |
|---|---|
| DB schema + RLS policies | ✅ `supabase/schema.sql` |
| Supabase client helpers | ✅ `lib/supabase/` (client, server, middleware) |
| Auth session middleware | ✅ `middleware.ts` → `lib/supabase/middleware.ts` |
| Core type definitions | ✅ `lib/types.ts` |
| Clause library | ✅ `lib/clause-library.ts` |
| Jurisdiction router | ✅ `lib/jurisdiction-router.ts` |
| Prompt builder | ✅ `prompts/builder.ts` |
| Claude streaming integration | ✅ `prompts/generate.ts` |
| Generation API route | ✅ `app/api/generate/route.ts` |
| Root layout + global CSS | ✅ `app/layout.tsx`, `app/globals.css` |
| Auth pages UI | ✅ `app/(auth)/` — login, signup, reset-password, update-password |
| PolicyWizard UI component | 🚧 `PolicyWizard.jsx` (scaffolded, not wired to API) |
| Stripe integration | ❌ Not yet built |
| Document history / management | ❌ Not yet built |
| PDF / DOCX export | ❌ Not yet built |

---

### Project structure

```
/app
  layout.tsx               — root layout (fonts, metadata)
  globals.css              — CSS custom properties + reset (PolicyPen design tokens)
  /api/generate/route.ts   — core generation endpoint (auth → cache → Claude SSE → save)
  /api/webhooks/stripe/    — Stripe webhook handler (not yet built)
  /(auth)/
    layout.tsx             — centred card shell shared by all auth pages
    /login/                — email/password sign-in + Server Action
    /signup/               — sign-up with confirm-password check + Server Action
    /reset-password/       — request password-reset email + Server Action
    /reset-password/update/— set new password after clicking email link
  /(dashboard)/            — protected routes (not yet built)
/components
  /ui/                     — shadcn primitives only
  /shared/                 — reusable app-level components
/lib
  /supabase/client.ts      — browser Supabase client
  /supabase/server.ts      — server Supabase client + service-role client
  /supabase/middleware.ts  — session refresh (called from middleware.ts)
  /types.ts                — PolicyType, Jurisdiction, Questionnaire, Clause, BuiltPrompt, GenerationResult
  /clause-library.ts       — all jurisdiction-aware clauses
  /jurisdiction-router.ts  — maps questionnaire answers → active jurisdictions
/prompts
  /builder.ts              — assembles system + user prompts from questionnaire + clauses
  /generate.ts             — Claude API streaming wrapper + cost tracking
/supabase
  /schema.sql              — Postgres DDL + RLS policies (apply via Supabase SQL Editor or CLI)
/types
  /database.ts             — Supabase-generated TypeScript types (regenerate after schema changes)
middleware.ts              — Next.js middleware (auth session refresh, protects all non-static routes)
PolicyWizard.jsx           — multi-step questionnaire UI component (work-in-progress)
```

---

### Key conventions

- **Server components by default** — add `"use client"` only when client interactivity is required.
- **No `any` types** — define interfaces in `/lib/types.ts` or `/types/database.ts`.
- **Supabase clients** — use `lib/supabase/client.ts` in client components, `lib/supabase/server.ts` in server components and API routes. Never instantiate a client directly.
- **Claude API calls** — go through `prompts/generate.ts` only. Prompts live in `prompts/builder.ts` as named exports — never inline.
- **API route shape** — always return `{ data, error }`. Use try/catch on every async operation. Validate input before processing.
- **Streaming** — generation endpoints use SSE (`text/event-stream`). Keep `export const runtime = 'nodejs'` on those routes.
- **RLS required** — every new Supabase table must have Row Level Security enabled with appropriate policies before merging.
- **Component size** — keep files under 150 lines; extract sub-components when a file would exceed that.
- **No hardcoded values** — all secrets and config via `process.env`.
- **Error handling** — no silent failures, no empty catch blocks (except the cookie-setter pattern in Supabase server client).

---

### Database tables (Supabase / Postgres)

| Table | Purpose |
|---|---|
| `policies` | Generated policy documents — versioned per `(user_id, product_name, policy_type)`. Has a 24h cache check in the generation route. |
| `law_updates` | Admin-inserted rows that invalidate the 24h cache when a regulation changes. Service-role write, authenticated read. |

> To apply the schema: paste `supabase/schema.sql` into the Supabase SQL Editor, or run `supabase db push` with the Supabase CLI.

To regenerate TypeScript types after schema changes:
```bash
npx supabase gen types typescript --local > types/database.ts
```

---

### Environment variables

Required in `.env.local` (local) and Vercel environment settings (production). **Never commit these.**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=         # e.g. https://policypenpro.com
```

---

### Available tooling on the VM

- **Node.js** v22 (via nvm)
- **npm** (use this — `package-lock.json` is the lockfile)
- **Python** 3.12

---

### Lint / Test / Build / Run

```bash
# Install dependencies
npm install

# Development server (Turbopack)
npm run dev

# Type-check (run after every major change)
npm run type-check        # tsc --noEmit

# Lint
npm run lint

# Production build
npm run build

# Start production server
npm start
```

> There are no automated tests yet. Add them under `__tests__/` or as `*.test.ts` co-located files when building new features.

---

### Agent behaviour guidelines

- **Before editing**: state which files you will touch and why.
- **After major changes**: run `npm run type-check` to catch TypeScript errors.
- **Never delete working code** — refactor or extend instead.
- **Prefer existing patterns** — check `lib/`, `prompts/`, and `app/api/generate/route.ts` before introducing new abstractions.
- **When adding a feature**: also add or update the corresponding TypeScript type in `lib/types.ts`.
- **If a task touches more than 5 files**: list them all and confirm the scope before starting.
- **Do not modify** `lib/supabase/middleware.ts` or `middleware.ts` unless the task is specifically about auth session handling.

---

### What to build next (priority order)

1. ~~Auth pages — `/app/(auth)/login`, `/signup`, `/reset-password`~~ ✅ Done
2. Stripe integration — `/lib/stripe.ts`, `/app/api/webhooks/stripe/route.ts`, subscription gating in generation route
3. Dashboard — document history, editor, settings pages under `/app/(dashboard)/`
4. Wire `PolicyWizard.jsx` to `POST /api/generate` with SSE streaming display
5. Export (PDF / DOCX)
6. Polish + onboarding flow
