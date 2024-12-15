import { integrationTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, workspaceProtectedProcedure } from "../trpc";

export const integrationRouter = createTRPCRouter({
  listIntegrations: workspaceProtectedProcedure
    .query(async ({ ctx }) => {
      try {
        const integrations = await ctx.db
          .select()
          .from(integrationTable)
          .where(eq(integrationTable.workspaceId, ctx.activeWorkspaceId));
        return integrations;
      } catch (error) {
        console.error("Failed to list integrations:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list integrations",
        });
      }
    }),

  deleteIntegration: workspaceProtectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.db
          .delete(integrationTable)
          .where(and(
            eq(integrationTable.id, input.integrationId),
            eq(integrationTable.workspaceId, ctx.activeWorkspaceId),
          ));
        return { success: true };
      } catch (error) {
        console.error("Failed to delete integration:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete integration",
        });
      }
    }),
});
