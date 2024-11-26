import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PATH_ONBOARDING } from './lib/paths';

const isProtectedRoute = createRouteMatcher([
  "/",
  "/dashboard(.*)",
  "/chat(.*)",
]);

const isOnboardingRoute = createRouteMatcher([PATH_ONBOARDING])
const isApiRoute = createRouteMatcher(['/api(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth()

  // User is logged in and on the /onboarding route
  if (userId && (isOnboardingRoute(request) || isApiRoute(request))) {
    return NextResponse.next();
  }
  
  // User isn't signed in and the route is protected
  if (!userId && (isProtectedRoute(request) || isOnboardingRoute(request))) {
    return redirectToSignIn();
  }

  // Catch users who do not have `onboardingComplete: true` in their publicMetadata
  // Redirect them to the /onboarding route to complete onboarding
  // if (userId && !sessionClaims?.metadata?.onboardingComplete) {
  //   const onboardingUrl = new URL(PATH_ONBOARDING, request.url)
  //   return NextResponse.redirect(onboardingUrl)
  // }

  // If the user is logged in and the route is protected, let them view.
  if (userId && isProtectedRoute(request)) return NextResponse.next()

  
},
{ debug: process.env.NODE_ENV === 'development' }
)

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}