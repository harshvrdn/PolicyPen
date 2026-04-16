'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    redirect('/reset-password?error=Please+enter+your+email')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/update`,
  })

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/reset-password?message=Check+your+email+for+a+password+reset+link')
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    redirect('/reset-password/update?error=Please+fill+in+all+fields')
  }

  if (password !== confirmPassword) {
    redirect('/reset-password/update?error=Passwords+do+not+match')
  }

  if (password.length < 8) {
    redirect('/reset-password/update?error=Password+must+be+at+least+8+characters')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect(`/reset-password/update?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?message=Password+updated+successfully.+Please+sign+in.')
}
