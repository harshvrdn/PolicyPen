# CLAUDE.md — PolicyPen
# Place this file at: repo root (same level as package.json)
# Claude Code reads this automatically on every session.

## What This Project Is
PolicyPen — AI-powered legal/policy document generator SaaS.
Users describe what they need, Claude generates a structured legal document.
Solo founder. Stack: Next.js 15, Supabase (data only), Clerk, Anthropic API, Dodo Payments, Vercel.

---

## Current State
- Auth: Clerk ✅ (middleware + sign-in/sign-up via Clerk hosted pages)
- DB: Supabase ✅ (data only — no Supabase Auth, no Supabase users)
- AI: Anthropic Claude ✅ (generation endpoint streaming SSE)
- Billing: Dodo Payments ✅ (webhook handler at /api/webhooks/dodo)
- UI: scaffolded (basic layout, pages exist)
- Dashboard: not yet built

## What Needs Building (in priority order)
1. Dashboard UI (list documents, upgrade CTA)
2. Stripe-style checkout flow via Dodo Payments SDK
3. Plan gating in generate endpoint (check user_subscriptions table)
4. Document CRUD (list, view, delete, export to PDF)
5. Onboarding / product setup wizard

---

## Auth Model
- Clerk manages all auth (sign-in, sign-up, sessions, JWTs)
- Supabase RLS uses Clerk JWTs: `auth.uid()` matches `users.clerk_id`
- Clerk JWT Template "supabase" must be configured in Clerk Dashboard
- NO Supabase Auth users — do not call `supabase.auth.*`

---

## Key Files
| File | Purpose |
|---|---|
| `/lib/supabase/client.ts` | All Supabase clients (browser, server, service) |
| `/lib/supabase/middleware.ts` | Supabase middleware client |
| `/lib/db/dal.ts` | Data access layer — all DB queries go here |
| `/lib/types.ts` | Shared TypeScript interfaces |
| `/prompts/generate.ts` | Claude generation prompts |
| `/app/api/generate/route.ts` | Core generation endpoint (Clerk auth + SSE streaming) |
| `/app/api/webhooks/dodo/route.ts` | Dodo Payments webhook handler |
| `/app/api/webhooks/clerk/route.ts` | Clerk webhook handler (user sync to Supabase) |
| `/middleware.ts` | Clerk route protection |

---

## Database Schema (Supabase / Postgres)

```sql
-- No Supabase auth.users — Clerk manages auth

-- Users (synced from Clerk webhook)
create table users (
  clerk_id text primary key,
  email text,
  full_name text,
  plan text default 'free',  -- 'free' | 'starter' | 'builder' | 'studio'
  created_at timestamptz default now()
);

-- Policies (generated documents)
create table policies (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(clerk_id) not null,
  product_name text not null,
  policy_type text not null,  -- 'privacy' | 'tos' | 'cookie' | 'refund'
  content_html text not null,
  version int default 1,
  tokens_used int,
  cost_usd numeric(10,6),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Law updates (triggers policy regeneration)
create table law_updates (
  id uuid primary key default gen_random_uuid(),
  title text,
  affects_policy_types text[],
  created_at timestamptz default now()
);

-- Subscriptions (synced from Dodo Payments webhooks)
create table user_subscriptions (
  user_id text primary key references users(clerk_id),
  dodo_customer_id text,
  dodo_subscription_id text,
  plan text,  -- 'starter' | 'builder' | 'studio'
  status text,  -- 'active' | 'cancelled' | 'past_due'
  current_period_end timestamptz,
  created_at timestamptz default now()
);
```

---

## Business Logic

### Free vs Paid
- Free: limited policy generations (enforce via user_subscriptions check)
- Starter / Builder / Studio: unlimited, different feature sets
- Gate enforced server-side in `/app/api/generate/route.ts`

### Document Generation Flow
1. Clerk auth validates userId
2. Cache check: existing policy < 24h old → return cached
3. Law update check: if newer law update exists → regenerate
4. Stream Claude response → SSE chunks to client
5. On complete: save to `policies` table
6. Return done event with cost/token metadata

### Dodo Payments Webhook Events
- `payment.succeeded` → upsert user_subscriptions, set plan/status active
- `subscription.cancelled` → set status cancelled
- `subscription.renewed` → extend current_period_end

---

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_KEY=
DODO_PAYMENTS_ENVIRONMENT=        # "live_mode" | "test_mode" (default: live_mode)
DODO_PRICE_ID_STARTER=
DODO_PRICE_ID_BUILDER=
DODO_PRICE_ID_STUDIO=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

---

## Do Not Touch
- `middleware.ts` — Clerk route protection is correctly configured
- `lib/supabase/client.ts` — Supabase client factories, Clerk JWT injection
- `tailwind.config.ts` — design tokens are set

---

## Commands
```bash
npm run dev          # start dev server
npm run build        # production build
npm run type-check   # tsc --noEmit (run after major changes)
supabase db push     # push schema changes to remote
```
