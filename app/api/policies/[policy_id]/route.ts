/**
 * DELETE /api/policies/[policy_id]
 *
 * Archives a policy (soft-delete). RLS on the server client ensures
 * users can only archive their own policies.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { archivePolicy } from "@/lib/db/dal"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ policy_id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { policy_id } = await params

  try {
    await archivePolicy(policy_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api:delete-policy]", err)
    return NextResponse.json({ error: "Failed to archive policy" }, { status: 500 })
  }
}
