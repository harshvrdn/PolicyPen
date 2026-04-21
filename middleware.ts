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
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/features",
  "/blog(.*)",
  "/p/(.*)",
  "/api/webhooks/(.*)",
  "/api/ack/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
])

const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
])

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
    host !== `www.${appHost}` &&        // ← fix: treat www as app host
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
  const customDomainResponse = handleCustomDomain(request)
  if (customDomainResponse) return customDomainResponse

  const { userId } = await auth()
  const { nextUrl } = request

  if (userId && isAuthRoute(request)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!userId && isProtectedRoute(request)) {
    const signInUrl = new URL("/sign-in", nextUrl)
    signInUrl.searchParams.set("redirect_url", nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}