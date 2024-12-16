import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { conversationRouter } from "./routers/conversation/conversationRouter";
import { editorRouter } from "./routers/editor/editorRouter";
import { evalRouter } from "./routers/eval/evalRouter";
import { integrationRouter } from "./routers/integrationRouter";
import { onboardingRouter } from "./routers/onboardingRouter";
import { userRouter } from "./routers/userRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  conversation: conversationRouter,
  editor: editorRouter,
  onboarding: onboardingRouter,
  integration: integrationRouter,
  eval: evalRouter,
  user: userRouter,
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
