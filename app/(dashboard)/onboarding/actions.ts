"use server"

import { auth } from "@clerk/nextjs/server"
import { completeOnboarding } from "@/lib/db/dal"

export async function markOnboardingDone(): Promise<void> {
  const { userId } = await auth()
  if (!userId) return
  try {
    await completeOnboarding(userId)
  } catch (err) {
    // User row may not exist yet (Clerk webhook delay) — not fatal for skip
    console.warn("[onboarding] markOnboardingDone:", err)
  }
}
