import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { editorRouter } from "./routers/editor/editorRouter";
import { evalRouter } from "./routers/eval/evalRouter";
import { knowledgeRouter } from "./routers/knowledge/knowledgeRouter";
import { onboardingRouter } from "./routers/onboardingRouter";
import { userRouter } from "./routers/userRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  onboarding: onboardingRouter,
  user: userRouter,
  editor: editorRouter,
  knowledge: knowledgeRouter,
  eval: evalRouter,
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
