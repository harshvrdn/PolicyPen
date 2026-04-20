/**
 * middleware.ts — PolicyPen route protection
 *
 * Clerk handles auth. This middleware:
 *   1. Enforces authentication on protected routes
 *   2. Redirects unauthenticated users to /sign-in
 *   3. Redirects authenticated users away from auth pages
 *   4. Lets public routes through (landing, hosted policy pages, webhooks)
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ─── Route classification ──────────────────────────────────────────────────

// Public: no auth needed
const isPublicRoute = createRouteMatcher([
  "/",                          // Landing page
  "/pricing",
  "/features",
  "/blog(.*)",
  "/p/(.*)",                    // Hosted policy pages: /p/[slug]
  "/api/webhooks/(.*)",         // Clerk + Dodo webhooks
  "/api/ack/(.*)",              // Policy acknowledgement endpoint (public)
  "/sign-in(.*)",
  "/sign-up(.*)",
])

// Auth pages: redirect away if already signed in
const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
])

// Protected: requires auth
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/products(.*)",
  "/policies(.*)",
  "/settings(.*)",
  "/api/generate(.*)",
  "/api/products(.*)",
  "/api/policies(.*)",
])

// ─── Custom domain detection ──────────────────────────────────────────────
function handleCustomDomain(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? ""
  const appHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : "policypen.io"

  const isCustomDomain =
    host !== appHost &&
    !host.includes("localhost") &&
    !host.includes("vercel.app")

  if (!isCustomDomain) return null

  const url = request.nextUrl.clone()
  const rewriteUrl = new URL(
    `/domain/${encodeURIComponent(host)}${url.pathname}`,
    url
  )
  const response = NextResponse.rewrite(rewriteUrl)
  response.headers.set("x-custom-domain", host)
  return response
}

// ─── Middleware ────────────────────────────────────────────────────────────
export default clerkMiddleware(async (auth, request) => {
  // Custom domain: rewrite to /domain/[host] before auth checks
  const customDomainResponse = handleCustomDomain(request)
  if (customDomainResponse) return customDomainResponse

  const { userId } = await auth()
  const { nextUrl } = request

  // Authenticated user hitting auth pages → redirect to dashboard
  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // Unauthenticated user hitting protected route → redirect to sign-in
  if (!userId && isProtectedRoute(request)) {
    const signInUrl = new URL("/sign-in", nextUrl)
    signInUrl.searchParams.set("redirect_url", nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
