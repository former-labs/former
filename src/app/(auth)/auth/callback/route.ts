import { env } from '@/env'
import { PATH_LOGIN } from '@/lib/paths'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log("CALLBACK ROUTE", JSON.stringify(request, null, 2));

  if (!code) {
    return NextResponse.redirect(`${origin}${PATH_LOGIN}?error=missing-code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}${PATH_LOGIN}?error=auth-code-error`)
  }

  // Get the authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    return NextResponse.redirect(`${origin}${PATH_LOGIN}?error=user-not-found`)
  }

  // Check for existing user
  const existingUser = await db.query.userTable.findFirst({
    where: (user, { eq }) => eq(user.supabaseAuthId, authUser.id)
  })

  // Create new user if doesn't exist
  if (!existingUser) {
    try {
      const nameParts = authUser.user_metadata?.full_name?.split(' ') ?? []
      await db.insert(userTable).values({
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' '),
        email: authUser.email ?? '',
        supabaseAuthId: authUser.id,
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return NextResponse.redirect(`${origin}${PATH_LOGIN}?error=user-creation-failed`)
    }
  }

  // Handle redirect based on environment
  const forwardedHost = request.headers.get('x-forwarded-host')
  const redirectBase = env.NODE_ENV === 'development' || !forwardedHost
    ? origin
    : `https://${forwardedHost}`

  return NextResponse.redirect(`${redirectBase}${next}`)
}
