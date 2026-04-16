'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !password || !confirmPassword) {
    redirect('/signup?error=Please+fill+in+all+fields')
  }

  if (password !== confirmPassword) {
    redirect('/signup?error=Passwords+do+not+match')
  }

  if (password.length < 8) {
    redirect('/signup?error=Password+must+be+at+least+8+characters')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/signup?message=Check+your+email+to+confirm+your+account')
}
