import { env } from '@/env'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
  }

  // Handle redirect based on environment
  const forwardedHost = request.headers.get('x-forwarded-host')
  const redirectBase = env.NODE_ENV === 'development' || !forwardedHost
    ? origin
    : `https://${forwardedHost}`

  return NextResponse.redirect(`${redirectBase}${next}`)
}
