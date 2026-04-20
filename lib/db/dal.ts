/**
 * PolicyPen Data Access Layer (DAL)
 *
 * All DB queries live here. Components and API routes import from this
 * file — never call Supabase directly in route handlers or components.
 *
 * Convention:
 *   - Server-side functions use createServerClient() (RLS enforced)
 *   - Webhook/admin functions use createServiceClient() (RLS bypassed)
 *   - All functions throw on error — callers handle try/catch
 */

import { createServerClient, createServiceClient } from "@/lib/supabase/client"
import type {
  User,
  Product,
  Policy,
  LawUpdate,
  PolicyType,
  PolicyStatus,
  UserDashboard,
  ProductPolicyStatus,
  TablesInsert,
  TablesUpdate,
} from "@/types/supabase"

// ═════════════════════════════════════════════════════════════
// USERS
// ═════════════════════════════════════════════════════════════

/** Get current user record by Clerk ID (from Clerk auth context) */
export async function getCurrentUser(clerkId: string): Promise<User | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", clerkId)
    .single()

  if (error?.code === "PGRST116") return null // not found
  if (error) throw new Error(`[DAL:getCurrentUser] ${error.message}`)
  return data
}

/** Get dashboard aggregate for current user */
export async function getUserDashboard(): Promise<UserDashboard | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("user_dashboard")
    .select("*")
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`[DAL:getUserDashboard] ${error.message}`)
  return data
}

/** Update user plan (called by Stripe webhook via service client) */
export async function updateUserPlan(
  clerkId: string,
  updates: {
    plan: User["plan"]
    stripe_customer_id?: string
    stripe_subscription_id?: string
    subscription_status?: string
    plan_expires_at?: string | null
  }
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("clerk_id", clerkId)

  if (error) throw new Error(`[DAL:updateUserPlan] ${error.message}`)
}

/** Increment monthly AI token usage */
export async function incrementTokenUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  const supabase = createServiceClient()
  // increment_token_usage is a custom DB function not in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)("increment_token_usage", {
    p_user_id: userId,
    p_tokens: tokensUsed,
  })
}

/** Mark onboarding complete */
export async function completeOnboarding(clerkId: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true } as unknown as never)
    .eq("clerk_id", clerkId)

  if (error) throw new Error(`[DAL:completeOnboarding] ${error.message}`)
}

// ═════════════════════════════════════════════════════════════
// PRODUCTS
// ═════════════════════════════════════════════════════════════

/** List all active products for current user */
export async function getUserProducts(): Promise<Product[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`[DAL:getUserProducts] ${error.message}`)
  return data ?? []
}

/** Get single product by slug (public — for hosted policy pages) */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`[DAL:getProductBySlug] ${error.message}`)
  return data
}

/** Get single product by ID (owner only — RLS enforced) */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`[DAL:getProductById] ${error.message}`)
  return data
}

/** Create a new product */
export async function createProduct(
  input: TablesInsert<"products">
): Promise<Product> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("products")
    .insert(input as unknown as never)
    .select()
    .single()

  if (error) throw new Error(`[DAL:createProduct] ${error.message}`)
  return data
}

/** Update product questionnaire data */
export async function updateProductQuestionnaire(
  productId: string,
  questionnaireData: Record<string, unknown>,
  completed = false
): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("products")
    .update({
      questionnaire_data: questionnaireData,
      questionnaire_completed_at: completed ? new Date().toISOString() : null,
    } as unknown as never)
    .eq("id", productId)

  if (error) throw new Error(`[DAL:updateProductQuestionnaire] ${error.message}`)
}

/** Update product settings */
export async function updateProduct(
  productId: string,
  updates: TablesUpdate<"products">
): Promise<Product> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("products")
    .update(updates as unknown as never)
    .eq("id", productId)
    .select()
    .single()

  if (error) throw new Error(`[DAL:updateProduct] ${error.message}`)
  return data
}

/** Generate a unique slug for a product name */
export async function generateProductSlug(name: string): Promise<string> {
  const supabase = await createServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.rpc("generate_slug", { name } as any)
  if (error) throw new Error(`[DAL:generateProductSlug] ${error.message}`)
  return data as string
}

/** Get policy status matrix for a product (cross-join view) */
export async function getProductPolicyStatus(
  productId: string
): Promise<ProductPolicyStatus[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("product_policy_status")
    .select("*")
    .eq("product_id", productId)

  if (error) throw new Error(`[DAL:getProductPolicyStatus] ${error.message}`)
  return data ?? []
}

// ═════════════════════════════════════════════════════════════
// POLICIES
// ═════════════════════════════════════════════════════════════

/** Get all current policies for a product */
export async function getProductPolicies(productId: string): Promise<Policy[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("product_id", productId)
    .eq("is_current_version", true)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`[DAL:getProductPolicies] ${error.message}`)
  return data ?? []
}

/** Get a specific current policy by type */
export async function getCurrentPolicy(
  productId: string,
  policyType: PolicyType
): Promise<Policy | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("product_id", productId)
    .eq("policy_type", policyType)
    .eq("is_current_version", true)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`[DAL:getCurrentPolicy] ${error.message}`)
  return data
}

/** Get policy by ID (for editor) */
export async function getPolicyById(id: string): Promise<Policy | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("id", id)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) throw new Error(`[DAL:getPolicyById] ${error.message}`)
  return data
}

/**
 * Get published policy for hosted page (public — no auth required)
 * Uses service client to bypass RLS for public page rendering
 */
export async function getPublishedPolicy(
  slug: string,
  policyType: PolicyType
): Promise<{ policy: Policy; product: Product } | null> {
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) return null

  const { data: policy } = await supabase
    .from("policies")
    .select("*")
    .eq("product_id", product.id)
    .eq("policy_type", policyType)
    .eq("is_current_version", true)
    .eq("status", "active")
    .not("published_at", "is", null)
    .single()

  if (!policy) return null
  return { policy, product }
}

/** Create a new policy record (before generation starts) */
export async function createPolicyRecord(
  input: TablesInsert<"policies">
): Promise<Policy> {
  const supabase = createServiceClient() // service role — called from API route
  const { data, error } = await supabase
    .from("policies")
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(`[DAL:createPolicyRecord] ${error.message}`)
  return data
}

/** Update policy after generation completes */
export async function savePolicyContent(
  policyId: string,
  updates: {
    content_html: string
    content_markdown?: string
    content_hash: string
    status: PolicyStatus
    word_count: number
    generation_tokens_used: number
    generation_cost_usd: number
    jurisdiction_codes: string[]
    clauses_used: string[]
    prompt_version: string
    generated_at: string
    published_at?: string
  }
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("policies")
    .update(updates)
    .eq("id", policyId)

  if (error) throw new Error(`[DAL:savePolicyContent] ${error.message}`)
}

/** Mark policy as generation error */
export async function markPolicyError(
  policyId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from("policies")
    .update({ status: "error", generation_error: errorMessage })
    .eq("id", policyId)
}

/** Publish policy (makes it visible on hosted page) */
export async function publishPolicy(policyId: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from("policies")
    .update({
      status: "active",
      published_at: new Date().toISOString(),
    } as unknown as never)
    .eq("id", policyId)

  if (error) throw new Error(`[DAL:publishPolicy] ${error.message}`)
}

/** Check if user can generate a policy (plan limit guard) */
export async function canUserGeneratePolicy(
  userId: string,
  productId: string
): Promise<{ allowed: boolean; reason?: string; plan?: string; policies_remaining?: number }> {
  const supabase = await createServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.rpc("can_user_generate_policy", {
    p_user_id: userId,
    p_product_id: productId,
  } as any)

  if (error) throw new Error(`[DAL:canUserGeneratePolicy] ${error.message}`)
  return data as { allowed: boolean; reason?: string; plan?: string; policies_remaining?: number }
}

/** Get version history for a policy type */
export async function getPolicyVersionHistory(
  productId: string,
  policyType: PolicyType
): Promise<Policy[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("policies")
    .select("id, version, status, generated_at, update_reason, word_count, generation_cost_usd, is_current_version")
    .eq("product_id", productId)
    .eq("policy_type", policyType)
    .order("version", { ascending: false })

  if (error) throw new Error(`[DAL:getPolicyVersionHistory] ${error.message}`)
  return (data ?? []) as Policy[]
}

// ═════════════════════════════════════════════════════════════
// PUBLIC DATA FETCHERS (no auth — service client)
// ═════════════════════════════════════════════════════════════

/** Get product + all active published policies by slug (public) */
export async function getPublicProduct(
  slug: string
): Promise<{ product: Product; policies: Policy[] } | null> {
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) return null

  const { data: policies } = await supabase
    .from("policies")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_current_version", true)
    .eq("status", "active")
    .not("published_at", "is", null)
    .order("policy_type", { ascending: true })

  return { product, policies: policies ?? [] }
}

/** Get product + single active policy by slug + type (public) */
export async function getPublicPolicy(
  slug: string,
  policyType: PolicyType
): Promise<{ product: Product; policy: Policy } | null> {
  const result = await getPublishedPolicy(slug, policyType)
  if (!result) return null
  return { product: result.product, policy: result.policy }
}

/** Get product + all active published policies by custom domain (public) */
export async function getProductByCustomDomain(
  domain: string
): Promise<{ product: Product; policies: Policy[] } | null> {
  const supabase = createServiceClient()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .ilike("custom_domain", domain)
    .eq("custom_domain_verified", true)
    .eq("is_active", true)
    .single()

  if (!product) return null

  const { data: policies } = await supabase
    .from("policies")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_current_version", true)
    .eq("status", "active")
    .not("published_at", "is", null)
    .order("policy_type", { ascending: true })

  return { product, policies: policies ?? [] }
}

/** Get product + single active policy by custom domain + type (public) */
export async function getPublicPolicyByDomain(
  domain: string,
  policyType: PolicyType
): Promise<{ product: Product; policy: Policy } | null> {
  const result = await getProductByCustomDomain(domain)
  if (!result) return null

  const policy = result.policies.find((p) => p.policy_type === policyType)
  if (!policy) return null

  return { product: result.product, policy }
}

// ═════════════════════════════════════════════════════════════
// LAW UPDATES
// ═════════════════════════════════════════════════════════════

/** Get published law updates (public — for dashboard feed) */
export async function getLawUpdates(limit = 10): Promise<LawUpdate[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("law_updates")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`[DAL:getLawUpdates] ${error.message}`)
  return data ?? []
}

/** Get unprocessed critical/major updates (for cron job) */
export async function getUnprocessedLawUpdates(): Promise<LawUpdate[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("law_updates")
    .select("*")
    .eq("processed", false)
    .in("severity", ["critical", "major"])
    .order("created_at", { ascending: true })

  if (error) throw new Error(`[DAL:getUnprocessedLawUpdates] ${error.message}`)
  return data ?? []
}

/** Mark law update as processed */
export async function markLawUpdateProcessed(
  id: string,
  policiesUpdated: number
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from("law_updates")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      policies_updated_count: policiesUpdated,
    })
    .eq("id", id)
}

// ═════════════════════════════════════════════════════════════
// POLICY ACKNOWLEDGEMENTS
// ═════════════════════════════════════════════════════════════

/** Record an end-user acknowledging a policy (public API, no auth) */
export async function recordAcknowledgement(input: {
  policy_id: string
  product_id: string
  policy_hash: string
  policy_version: number
  end_user_id?: string
  end_user_email?: string
  ip_address?: string
  user_agent?: string
  jurisdiction_detected?: string
  is_gdpr_jurisdiction?: boolean
  is_ccpa_jurisdiction?: boolean
  cookie_consent_analytics?: boolean
  cookie_consent_marketing?: boolean
}): Promise<string> {
  const supabase = createServiceClient() // public endpoint — no user session
  const { data, error } = await supabase
    .from("policy_acknowledgements")
    .insert({
      ...input,
      dsar_sla_days: input.is_gdpr_jurisdiction ? 30 : input.is_ccpa_jurisdiction ? 45 : 30,
    })
    .select("id")
    .single()

  if (error) throw new Error(`[DAL:recordAcknowledgement] ${error.message}`)
  return data.id
}

/** Get acknowledgements for a product (owner analytics) */
export async function getProductAcknowledgements(
  productId: string,
  limit = 100
) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("policy_acknowledgements")
    .select("*")
    .eq("product_id", productId)
    .order("acknowledged_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`[DAL:getProductAcknowledgements] ${error.message}`)
  return data ?? []
}
