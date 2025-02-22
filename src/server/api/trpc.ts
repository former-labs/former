/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { type ActiveRole } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { isAdminEmail } from "../auth/admin";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const getAuth = async () => {
    // const startTime = Date.now();

    // In my test now this takes typically 200-300ms
    // Not great for autocomplete AI
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // const endTime = Date.now();
    // console.log(`Auth time taken: ${endTime - startTime} ms`);

    return user;
  };

  return {
    db,
    getAuth: getAuth,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    // const waitMs = Math.floor(Math.random() * 50) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);


// When a user is trying to access a resource that is not workspace-specific
export const authUserProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const auth = await ctx.getAuth();

    if (!auth?.id) {
      throw new Error("You must be logged in to access this resource");
    }

    return next({
      ctx: {
        ...ctx,
        auth: auth,
      },
    });
  });

// Admin-only procedure that checks for specific email addresses
export const adminProtectedProcedure = authUserProcedure
  .use(async ({ ctx, next }) => {
    if (!ctx.auth.email || !isAdminEmail(ctx.auth.email)) {
      throw new Error("You must be an admin to access this resource");
    }

    return next();
  });

/*
  When we expect both auth user and user to exist.
  This should generally not be used except in onboarding stuff where the user
  has not yet selected a workspace.
*/
export const userProtectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const auth = await ctx.getAuth();
    if (!auth) {
      throw new Error("You must be logged in to access this resource");
    }

    const user = await db.query.userTable.findFirst({
      where: (user, { eq }) => eq(user.supabaseAuthId, auth.id),
      with: {
        roles: {
          with: {
            workspace: true
          }
        }
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    return next({
      ctx: {
        ...ctx,
        auth,
        user,
      },
    });
  });


/**
 * Protected (authenticated) procedure
 *
 * When a user is trying to access a resource that is workspace-specific
 */
export const workspaceProtectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const auth = await ctx.getAuth();

    if (!auth?.id) {
      throw new Error("You must be logged in to access this resource");
    }
    
    const activeRole = auth.app_metadata?.activeRole as ActiveRole | null;
    const activeRoleId = activeRole?.id ?? null;
    const activeWorkspaceId = activeRole?.workspaceId ?? null; 
    const activeRoleType = activeRole?.roleType ?? null;

    if (!activeRoleId) {
      throw new Error("User does not have an active role");
    }

    if (!activeWorkspaceId) {
      throw new Error("User does not have an active workspace");
    }

    if (!activeRoleType) {
      throw new Error("User does not have an active role type");
    }

    return next({
      ctx: {
        ...ctx,
        auth,
        activeRoleId,
        activeRoleType,
        activeWorkspaceId,
      },
    });
  });

