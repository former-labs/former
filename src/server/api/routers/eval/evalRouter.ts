import { adminProtectedProcedure, createTRPCRouter } from "@/server/api/trpc";
// import { integrationTable } from "@/server/db/schema";
import { z } from "zod";

export const evalRouter = createTRPCRouter({
  evalSql: adminProtectedProcedure
    .input(
      z.object({
        integrationId: z.string(),
        query: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // I've commented this out because we don't have an integration table so we get type errors?

      /*
      try {
        // Get the integration
        const [integration] = await ctx.db
          .select()
          .from(integrationTable)
          .where(
            and(
              eq(integrationTable.id, input.integrationId),
              eq(integrationTable.workspaceId, ctx.activeWorkspaceId)
            )
          );

        if (!integration) {
          throw new Error("Integration not found");
        }

        // Execute query based on integration type
        if (integration.type === "bigquery") {
          // Execute BigQuery SQL
          const credentials = integration.credentials as Record<string, unknown>;
          // TODO: Implement BigQuery execution logic
          return {
            rows: [],
            message: "BigQuery execution not implemented yet"
          };
        }

        throw new Error(`Unsupported integration type: ${integration.type}`);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
      }
      */
    }),
});
