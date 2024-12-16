import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const editorRouter = createTRPCRouter({
  submitMessage: workspaceProtectedProcedure
    .input(z.object({
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        message: input.message.toUpperCase(),
      };
    }),
});
