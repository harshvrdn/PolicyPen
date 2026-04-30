/**
 * DELETE /api/products/[product_id]
 *
 * Deactivates a product (soft-delete: is_active → false). RLS on the
 * server client ensures users can only deactivate their own products.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { deactivateProduct } from "@/lib/db/dal"
import { createServiceClient } from "@/lib/supabase/client"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ product_id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { product_id } = await params

  try {
    await deactivateProduct(product_id)

    // Decrement products_count so plan limit check stays accurate after deletion
    const supabase = createServiceClient()
    await supabase.rpc("decrement_products_count", { p_clerk_id: userId }).catch(() => {
      // Fall back to manual decrement if RPC doesn't exist
      supabase
        .from("users")
        .select("products_count")
        .eq("clerk_id", userId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from("users")
              .update({ products_count: Math.max(0, (data.products_count ?? 1) - 1) })
              .eq("clerk_id", userId)
          }
        })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api:delete-product]", err)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
