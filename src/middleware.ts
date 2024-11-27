import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { PATH_CHAT, PATH_DASHBOARD, PATH_HOME, PATH_LOGIN, PATH_ONBOARDING } from './lib/paths';



// Defining routes to allow logic within updateSession middleware, below
const isProtectedRoute = createRouteMatcher([
  PATH_HOME,
  `${PATH_DASHBOARD}(.*)`,
  `${PATH_CHAT}(.*)`,
]);

const isOnboardingRoute = createRouteMatcher([PATH_ONBOARDING])
const isApiRoute = createRouteMatcher(['/api(.*)'])


export async function middleware(request: NextRequest) {
  const { supabaseServerClient } = await updateSession(request)


  const {
    data: { user },
  } = await supabaseServerClient.auth.getUser()

  // User is logged in and on the /onboarding route
  if (user && (isOnboardingRoute(request) || isApiRoute(request))) {
    return NextResponse.next();
  }
  
  // Catch users who do not have `onboardingComplete: true` in their publicMetadata
  // Redirect them to the /onboading route to complete onboarding
  if (user && !user.user_metadata.onboardingComplete) {
    const onboardingUrl = new URL(PATH_ONBOARDING, request.url)
    return NextResponse.redirect(onboardingUrl)
  }
  
  // User isn't signed in and the route is protected
  if (!user && (isProtectedRoute(request) || isOnboardingRoute(request))) {
    const signInUrl = new URL(PATH_LOGIN, request.url)
    return NextResponse.redirect(signInUrl)
  }

  // If none of the above conditions are met, let them view the page.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}



function createRouteMatcher(routes: Array<RegExp | string> | RegExp | string | ((req: NextRequest) => boolean)) {
  return (req: NextRequest): boolean => {
    // Handle function matcher
    if (typeof routes === 'function') {
      return routes(req);
    }

    // Convert single route to array
    const routePatterns = Array.isArray(routes) ? routes : [routes];

    // Get pathname from request URL
    const pathname = new URL(req.url).pathname;

    // Check each route pattern
    let match = false;
    match = routePatterns.some(pattern => {
      // Handle RegExp pattern
      if (pattern instanceof RegExp) {
        return pattern.test(pathname);
      }

      // Handle string pattern
      if (typeof pattern === 'string') {
        // First preserve the (.*) pattern
        const preservedPattern = pattern.replace(/\(\.?\*\)/g, '___CAPTURE___');
        
        // Escape special regex chars
        const escapedPattern = preservedPattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*');
        
        // Restore the (.*) pattern
        const regexPattern = escapedPattern.replace(/___CAPTURE___/g, '(.*)');

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(pathname);
      }

      return match;
    });

    return match;
  };
}
