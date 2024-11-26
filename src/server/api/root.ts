import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { conversationRouter } from "./routers/conversation/conversationRouter";
import { integrationRouter } from "./routers/conversation/integrationRouter";
import { onboardingRouter } from "./routers/conversation/onboardingRouter";
import { evalRouter } from "./routers/eval/evalRouter";
import { googleAnalyticsRouter } from "./routers/googleAnalytics/googleAnalyticsRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  conversation: conversationRouter,
  onboarding: onboardingRouter,
  integration: integrationRouter,
  eval: evalRouter,
  googleAnalytics: googleAnalyticsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
