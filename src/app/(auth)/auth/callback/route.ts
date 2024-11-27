import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'
import { db } from '@/server/db'
import { userTable } from '@/server/db/schema'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      // Get the authenticated user from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const existingUser = await db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.supabaseAuthId, authUser?.id ?? '')
      });

      if (!existingUser && authUser) {
        try {
          const nameParts = authUser.user_metadata?.full_name?.split(' ') ?? [];
          await db.insert(userTable).values({
            firstName: nameParts[0] ?? '',
            lastName: nameParts.slice(1).join(' ') ?? '',
            email: authUser.email ?? '',
            supabaseAuthId: authUser.id,
          });
        } catch (error) {
          console.error('Error creating user:', error);
          return NextResponse.redirect(`${origin}/login?error=user-creation-failed`);
        }
      }

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
