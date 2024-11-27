import { env } from '@/env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { PATH_CHAT, PATH_DASHBOARD, PATH_HOME, PATH_LOGIN, PATH_ONBOARDING } from '../paths';


// Defining routes to allow logic within updateSession middleware, below
const isProtectedRoute = createRouteMatcher([
  PATH_HOME,
  `${PATH_DASHBOARD}(.*)`,
  `${PATH_CHAT}(.*)`,
]);

const isOnboardingRoute = createRouteMatcher([PATH_ONBOARDING])
const isApiRoute = createRouteMatcher(['/api(.*)'])


export async function updateSession(request: NextRequest) {
  // Create initial response
  const supabaseResponse = NextResponse.next({
    request
  })

  const supabaseServerClient = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set cookies on both request and response
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabaseServerClient.auth.getUser()

  // Create new response for redirects while preserving cookies
  const createRedirectResponse = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value);
    });
    return response;
  }

  // Your existing routing logic, but using the new createRedirectResponse
  if (user && (isOnboardingRoute(request) || isApiRoute(request))) {
    return supabaseResponse;
  }
  
  // if (user && !user.user_metadata?.onboardingComplete) {
  //   const onboardingUrl = new URL(PATH_ONBOARDING, request.url)
  //   return createRedirectResponse(onboardingUrl)
  // }
  
  if (!user && (isProtectedRoute(request) || isOnboardingRoute(request))) {
    const signInUrl = new URL(PATH_LOGIN, request.url)
    return createRedirectResponse(signInUrl)
  }

  return supabaseResponse;
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
