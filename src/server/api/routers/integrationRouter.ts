import { env } from "@/env";
import { integrationTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createTRPCRouter, workspaceProtectedProcedure } from "../trpc";
import { BigQuery } from '@google-cloud/bigquery';

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

  connectGoogleAnalytics: workspaceProtectedProcedure
    .mutation(async ({ ctx }) => {
      // Create state JWT
      try {
        const state = jwt.sign(
          {
            workspaceId: ctx.activeWorkspaceId,
            userId: ctx.auth.id,
            timestamp: Date.now(),
          },
          env.OAUTH_CALLBACK_SECRET,
          { expiresIn: "1h" }
        );

        const REQUIRED_SCOPES = [
          'https://www.googleapis.com/auth/analytics.readonly',
        ];

        // Construct OAuth URL
        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.append("client_id", env.GOOGLE_OAUTH_CLIENT_ID);
        authUrl.searchParams.append("redirect_uri", env.GOOGLE_OAUTH_REDIRECT_URI);
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append("access_type", "offline");
        authUrl.searchParams.append("prompt", "consent");
        authUrl.searchParams.append(
          "scope",
          REQUIRED_SCOPES.join(" "),
        );
        authUrl.searchParams.append("state", state);

        return {
          redirectUrl: authUrl.toString()
        };
      } catch (error) {
        console.error("Failed to connect Google Analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect Google Analytics",
        });
      }
    }),

  connectBigQuery: workspaceProtectedProcedure
    .input(z.object({
      credentials: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const credentials = JSON.parse(input.credentials);
        // Validate the credentials format
        // Store the credentials securely
        // Create the integration record
        
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid credentials format',
        });
      }
    }),

  getWarehouseMetadata: workspaceProtectedProcedure
    .input(z.object({
      integrationId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const [integration] = await ctx.db
        .select()
        .from(integrationTable)
        .where(and(
          eq(integrationTable.id, input.integrationId),
          eq(integrationTable.workspaceId, ctx.activeWorkspaceId),
        ));

      if (!integration) {
        throw new Error("Integration not found");
      }

      if (integration.type === "bigquery") {
        const credentials = integration.credentials as Record<string, unknown>;
        const bigquery = new BigQuery({ credentials });
        
        const [projects] = await bigquery.getProjects();
        const metadata = await Promise.all(
          projects.map(async (project) => {
            const [datasets] = await bigquery.getDatasets({ projectId: project.id });
            const datasetsMetadata = await Promise.all(
              datasets.map(async (dataset) => {
                const [tables] = await dataset.getTables();
                const tablesMetadata = await Promise.all(
                  tables.map(async (table) => {
                    const [metadata] = await table.getMetadata();
                    return {
                      id: table.id,
                      name: table.id,
                      fields: metadata.schema.fields.map(field => ({
                        name: field.name,
                        type: field.type,
                        description: field.description,
                      })),
                    };
                  })
                );
                return {
                  id: dataset.id,
                  name: dataset.id,
                  tables: tablesMetadata,
                };
              })
            );
            return {
              id: project.id,
              name: project.id,
              datasets: datasetsMetadata,
            };
          })
        );
        return { projects: metadata };
      }

      throw new Error(`Unsupported integration type: ${integration.type}`);
    }),
});
