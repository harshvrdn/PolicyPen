# AGENTS.md

This file defines default behavior for coding agents working in this repository.

## Project

- Name: **PolicyPen**
- Purpose: AI product that generates legally structured policy documents for SaaS teams from a short questionnaire.

## Default stack

- Framework: **Next.js 14** (App Router)
- Language: **TypeScript**
- Styling: **Tailwind CSS**
- UI components: **shadcn/ui**
- Backend services: **Supabase** (auth + database), **Stripe** (payments)
- Deployment target: **Vercel**

## Architecture and coding conventions

1. Default to **Server Components**. Use Client Components only when interactivity requires it.
2. Keep Supabase access centralized in `lib/supabase.ts`.
3. Never hardcode secrets or environment-specific values; always read from `process.env`.
4. Keep components under ~150 lines. If a component grows beyond that, extract subcomponents or helpers.
5. Prefer existing project patterns over introducing new patterns.

## File and folder guidance

- `app/`: Next.js App Router routes and layouts.
- `components/`: Shared UI components (including shadcn-based components).
- `lib/`: Utilities, integrations, and shared server-side helpers.
- `lib/supabase.ts`: The canonical location for Supabase client setup and shared access helpers.

## Agent workflow expectations

1. Before editing, explicitly state which file(s) will be changed and why.
2. After major changes, run TypeScript checks.
3. Do not add new dependencies unless required by the task.
4. Prefer small, focused diffs and clear commit messages.

## Commands

When the app scaffolding exists, use these defaults:

- Install dependencies: `npm install`
- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Test: `npm test`
- Dev server: `npm run dev`
- Build: `npm run build`

If scripts differ in `package.json`, always follow the scripts defined there.

## Cursor Cloud specific instructions

### Current repository status

This repository may start as a greenfield project. At initial setup it contains minimal files and no runtime scripts.

### Available VM tooling

- Node.js v22 (via nvm), with `npm`, `pnpm`, and `yarn`
- Python 3.12

### Environment/bootstrap note

When real application code and a lockfile are present, ensure the environment setup script installs dependencies with the package manager used by the repository.
