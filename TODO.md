# PolicyPen — TODO

> AI-powered legal document generator (Privacy Policy, Terms of Service, Cookie Policy, Refund Policy).
> Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Stripe · Vercel

---

## Legend
- `[ ]` pending
- `[x]` done
- `[-]` in progress

---

## 1. Project Bootstrap

- [ ] Scaffold Next.js 14 app with TypeScript (`create-next-app`)
- [ ] Configure Tailwind CSS and `tailwind.config.ts`
- [ ] Install and initialise shadcn/ui
- [ ] Set up ESLint + Prettier with project conventions
- [ ] Add `.env.local.example` listing all required environment variables
- [ ] Add `AGENTS.md` lint/test/run commands once `package.json` exists

---

## 2. Supabase — Auth & Database

- [ ] Create Supabase project and wire up env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Implement `lib/supabase.ts` (browser client + server client helpers)
- [ ] Design and apply database schema migrations:
  - `profiles` table (linked to `auth.users`)
  - `documents` table (user_id, type, questionnaire_answers, generated_content, created_at, updated_at)
- [ ] Enable Row-Level Security (RLS) policies on all tables
- [ ] Set up Supabase Auth: email/password + Google OAuth
- [ ] Implement auth middleware (`middleware.ts`) to protect `/dashboard` routes

---

## 3. Core UI — Layout & Navigation

- [ ] Create root layout (`app/layout.tsx`) with global font and metadata
- [ ] Build `Navbar` component (logo, nav links, auth state toggle)
- [ ] Build `Footer` component
- [ ] Create marketing landing page (`app/page.tsx`)
  - Hero section with CTA
  - Feature highlights (4 document types)
  - Pricing section placeholder
  - Social proof / testimonial placeholder
- [ ] Create `/login` and `/signup` pages with Supabase Auth UI or custom forms
- [ ] Create `/dashboard` page (list of user's generated documents)

---

## 4. Questionnaire Flow

- [ ] Design multi-step questionnaire UX (2-minute target)
- [ ] Build `QuestionnaireWizard` client component (step navigation, progress bar)
- [ ] Define question sets for each document type:
  - Privacy Policy
  - Terms of Service
  - Cookie Policy
  - Refund Policy
- [ ] Persist in-progress answers to Supabase `documents` table (draft state)
- [ ] Validate required fields before allowing generation

---

## 5. AI Document Generation

- [ ] Choose and integrate AI provider (OpenAI / Anthropic) via environment variable
- [ ] Implement `lib/ai.ts` — prompt construction and streaming response helper
- [ ] Create Server Action or API Route `app/api/generate/route.ts`
  - Accepts document type + questionnaire answers
  - Streams generated legal text back to client
- [ ] Build `DocumentViewer` component with streaming markdown renderer
- [ ] Store final generated content back to Supabase `documents` row
- [ ] Add copy-to-clipboard and download-as-HTML/PDF actions

---

## 6. Stripe — Payments

- [ ] Create Stripe account and configure products/prices
- [ ] Add env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [ ] Implement `lib/stripe.ts` helper
- [ ] Build `/pricing` page with plan comparison table
- [ ] Implement Stripe Checkout session API route (`app/api/stripe/checkout/route.ts`)
- [ ] Implement Stripe webhook handler (`app/api/stripe/webhook/route.ts`) to update subscription status in Supabase
- [ ] Gate AI generation behind subscription / credit check
- [ ] Add billing management link (Stripe Customer Portal)

---

## 7. Document Management

- [ ] `/dashboard` — list all documents with type badge, date, and status
- [ ] `/documents/[id]` — view / re-generate / edit a specific document
- [ ] Allow users to rename documents
- [ ] Delete document (with confirmation dialog)
- [ ] Shareable public link for each document (`/p/[id]`)

---

## 8. Styling & Polish

- [ ] Implement light/dark mode toggle (Tailwind `dark:` + `next-themes`)
- [ ] Ensure full mobile responsiveness
- [ ] Add loading skeletons for async data fetches
- [ ] Add toast notifications (shadcn/ui `Sonner` or `Toast`)
- [ ] Accessibility audit (keyboard navigation, ARIA labels, contrast)

---

## 9. Testing

- [ ] Set up Vitest (unit) + Testing Library (component)
- [ ] Unit tests for AI prompt builders in `lib/ai.ts`
- [ ] Unit tests for questionnaire validation logic
- [ ] Integration test for Stripe webhook handler
- [ ] E2E smoke tests with Playwright (sign-up → generate document → download)

---

## 10. Deployment & DevOps

- [ ] Connect GitHub repo to Vercel; configure preview deployments
- [ ] Set all production env vars in Vercel dashboard
- [ ] Configure Supabase production project (separate from staging)
- [ ] Set up Stripe webhook endpoint pointing to production URL
- [ ] Add `AGENTS.md` update-script for `npm install` after first `package.json` commit
- [ ] Configure Vercel Analytics and Speed Insights

---

## 11. Legal & Compliance (meta)

- [ ] Add PolicyPen's own Privacy Policy (generated with PolicyPen, of course)
- [ ] Add PolicyPen's own Terms of Service
- [ ] Add Cookie consent banner
- [ ] Add GDPR/CCPA data deletion flow for user accounts

---

## Notes

- All Supabase interactions must go through `lib/supabase.ts`.
- Never hardcode environment variables — always use `process.env.*`.
- Keep components under 150 lines; extract sub-components if needed.
- Prefer server components; use `"use client"` only when interactivity is required.
