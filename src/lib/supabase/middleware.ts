import { env } from '@/env';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { PATH_CHAT, PATH_EDITOR, PATH_HOME, PATH_INTEGRATIONS, PATH_KNOWLEDGE, PATH_LOGIN, PATH_ONBOARDING, PATH_SIGNUP } from '../paths';


// Defining routes to allow logic within updateSession middleware, below
const isProtectedRoute = createRouteMatcher([
  PATH_HOME,
  `${PATH_CHAT}(.*)`,
  `${PATH_EDITOR}(.*)`,
  `${PATH_INTEGRATIONS}(.*)`,
  `${PATH_KNOWLEDGE}(.*)`,
]);

const isOnboardingRoute = createRouteMatcher([PATH_ONBOARDING])
const isLoginRoute = createRouteMatcher([PATH_LOGIN, PATH_SIGNUP])
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

  // Handle authentication and onboarding flow
  if (user) {
    // Allow API routes for authenticated users
    if (isApiRoute(request)) {
      return supabaseResponse;
    }

    // Redirect onboarded users away from auth/onboarding pages
    if (user.user_metadata?.onboarding_complete) {
      if (isOnboardingRoute(request) || isLoginRoute(request)) {
        return createRedirectResponse(new URL(PATH_HOME, request.url));
      }
    } else {
      // Allow non-onboarded users to access onboarding route
      if (isOnboardingRoute(request)) {
        return supabaseResponse;
      } else {
        // Redirect non-onboarded users to onboarding
        return createRedirectResponse(new URL(PATH_ONBOARDING, request.url));
      }
    }
  } 
  // Handle non-authenticated users
  else if (isProtectedRoute(request) || isOnboardingRoute(request)) {
    return createRedirectResponse(new URL(PATH_LOGIN, request.url));
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
