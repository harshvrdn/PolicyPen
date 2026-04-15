# AGENTS.md

## Cursor Cloud specific instructions

### Repository overview

**PolicyPen** — an AI-powered legal document generator.  
Generates legally-structured Privacy Policy, Terms of Service, Cookie Policy, and Refund Policy pages for SaaS products and indie makers — instantly, from a 2-minute questionnaire.

### Repository status

Greenfield repository. Initial commit contains only `README.md`, `LICENSE` (Apache 2.0), and `AGENTS.md`. No application code, dependencies, build system, or tests exist yet.

### Stack

- **Framework**: Next.js 14 (App Router), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui component library
- **Auth + Database**: Supabase
- **Payments**: Stripe
- **Deploy**: Vercel

### Conventions

- Default to **server components**; use `"use client"` only when client-side interactivity is required.
- All Supabase client/server calls are centralised in `/lib/supabase.ts`.
- **Never hardcode secrets or environment variables** — always reference via `process.env`.
- Keep individual component files under **150 lines**; extract sub-components when a file would exceed that.
- Prefer patterns that already exist in the codebase over introducing new ones.

### Required environment variables

These must be set in the deployment environment (Vercel) and locally in `.env.local` (never committed):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=          # or whichever AI provider is used for generation
NEXT_PUBLIC_APP_URL=     # e.g. https://policypenpro.com
```

### Available tooling on the VM

- **Node.js** v22 (via nvm) — `npm`, `pnpm`, and `yarn` are all available
- **Python** 3.12

### Lint / Test / Build / Run

> **Note**: Commands will be available once `package.json` is committed. Update this section and the `SetupVmEnvironment` update script at that point.

Once application code is added, expected commands are:

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Type-check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build
pnpm build

# Run tests (when added)
pnpm test
```

### Agent behaviour guidelines

- **Before editing**: state which files you will touch and why.
- **After major changes**: run `pnpm tsc --noEmit` to catch type errors.
- **Prefer existing patterns** in the codebase over introducing new abstractions.
- When adding new pages or API routes, follow the Next.js App Router file conventions (`page.tsx`, `route.ts`, `layout.tsx`).
- Supabase Row-Level Security (RLS) policies must be defined for every new table — never leave tables open.

### What to do when application code is first added

1. Commit code and `package.json` / lockfile.
2. Update the `SetupVmEnvironment` update script to run `pnpm install` (or the chosen package manager).
3. Update the **Lint / Test / Build / Run** section above with the real commands confirmed from `package.json`.
