/**
 * DELETE /api/products/[product_id]
 *
 * Deactivates a product (soft-delete: is_active → false). RLS on the
 * server client ensures users can only deactivate their own products.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { deactivateProduct } from "@/lib/db/dal"

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
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api:delete-product]", err)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
