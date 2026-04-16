# CLAUDE.md — PolicyPen
# Place this file at: repo root (same level as package.json)
# Claude Code reads this automatically on every session.

## What This Project Is
PolicyPen — AI-powered legal/policy document generator SaaS.
Users describe what they need, Claude generates a structured legal document.
Solo founder. Stack: Next.js 14, Supabase, Dodo Payments, Anthropic API, Vercel.

---

## Current State
- UI scaffolded (basic layout, pages exist)
- Supabase Auth set up (email/password)
- No backend implemented yet
- No AI integration yet
- No Dodo Payments integration yet

## What Needs Building (in priority order)
1. Supabase DB schema (documents, subscriptions tables)
2. Auth middleware (protect dashboard routes)
3. Claude API integration for document generation
4. Dodo Payments subscription gating (free tier = 3 docs, paid = unlimited)
5. Document CRUD (save, list, delete, export)

---

## Key Files
| File | Purpose |
|---|---|
| `/lib/supabase.ts` | Supabase client — all DB calls go here |
| `/lib/anthropic.ts` | Claude API client — all AI calls go here |
| `/lib/dodo.ts` | Dodo Payments client |
| `/lib/prompts/` | All Claude prompts as named exports |
| `/types/index.ts` | Shared TypeScript interfaces |
| `/app/api/generate/route.ts` | Core generation endpoint |
| `/app/api/webhooks/dodo/route.ts` | Dodo Payments webhook handler |

---

## Database Schema (Supabase / Postgres)

```sql
-- Users are managed by Supabase Auth (auth.users)

-- User profiles (extends auth.users)
create table user_profiles (
  id uuid references auth.users primary key,
  full_name text,
  plan text default 'free', -- 'free' | 'pro'
  documents_generated int default 0,
  created_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  prompt text not null,
  content text not null,
  document_type text, -- 'privacy_policy' | 'terms' | 'nda' | 'contract' etc
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscriptions (synced from Dodo Payments webhooks)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  dodo_customer_id text,
  dodo_subscription_id text,
  status text, -- 'active' | 'canceled' | 'past_due'
  plan text, -- 'pro'
  current_period_end timestamptz,
  created_at timestamptz default now()
);
```

---

## Business Logic

### Free vs Pro
- Free: 3 documents lifetime
- Pro: Unlimited documents
- Gate is enforced server-side in `/app/api/generate/route.ts`
- Check: `user_profiles.documents_generated >= 3` AND `subscriptions.status != 'active'`

### Document Generation Flow
1. User submits prompt + document type
2. API validates auth + checks plan limit
3. Stream Claude response to client
4. On stream complete: save to `documents` table, increment `documents_generated`
5. Return document id

### Dodo Payments Webhook Events to Handle
- `payment.succeeded` → create subscription record, update user plan to 'pro'
- `subscription.cancelled` → update subscription status, downgrade user to 'free'
- `payment.failed` → update subscription status to 'past_due'

---

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
NEXT_PUBLIC_DODO_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Claude API — Document Generation Prompt Pattern
Prompts live in `/lib/prompts/`. Example structure:

```typescript
// /lib/prompts/index.ts
export const DOCUMENT_GENERATION_PROMPT = (
  documentType: string,
  userPrompt: string,
  companyName: string
) => `
You are a legal document drafting assistant...
[prompt template here]
`
```

---

## Do Not Touch
- `/app/(auth)/` — auth pages are complete
- Supabase Auth config — do not change auth settings
- `tailwind.config.ts` — design tokens are set

---

## Commands
```bash
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit (run after major changes)
supabase start       # local Supabase instance
supabase db push     # push schema changes
```

---

## Useful Claude Code Commands for This Project
```bash
# Implement the full DB schema and RLS policies
claude "Implement the Supabase schema from CLAUDE.md, add RLS policies for all tables, create the migration file"

# Wire up the generation endpoint
claude "Build /app/api/generate/route.ts — validate auth, check plan limits, stream Claude API response, save document on completion"

# Add Dodo Payments webhooks
claude "Implement /app/api/webhooks/dodo/route.ts handling the three events in CLAUDE.md, update user_profiles and subscriptions tables accordingly"

# Protect dashboard routes
claude "Add Next.js middleware to protect all /dashboard routes, redirect unauthenticated users to /login using Supabase session"
```
