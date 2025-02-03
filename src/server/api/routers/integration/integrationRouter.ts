import { getAIChatTextResponse } from "@/server/ai/openai";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { integrationTable } from "@/server/db/schema";
import { DATABASE_TYPES, databaseMetadataSchema } from "@/types/connections";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

export const integrationRouter = createTRPCRouter({
  getDatabaseMetadata: workspaceProtectedProcedure
    .query(async ({ ctx }) => {
      const metadata = await db
        .select()
        .from(integrationTable)
        .where(eq(integrationTable.workspaceId, ctx.activeWorkspaceId))
        .limit(1);

      const metadataItem = metadata[0];

      if (!metadataItem) {
        return null;
      }

      return metadataItem.databaseMetadata;
    }),

  getIntegrations: workspaceProtectedProcedure
    .query(async ({ ctx }) => {
      const integrations = await db
        .select()
        .from(integrationTable)
        .where(eq(integrationTable.workspaceId, ctx.activeWorkspaceId));

      return integrations;
    }),

  createIntegration: workspaceProtectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["local", "cloud"]),
      databaseType: z.enum(DATABASE_TYPES),
      databaseMetadata: databaseMetadataSchema.optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const [newIntegration] = await db.insert(integrationTable).values({
        name: input.name,
        type: input.type,
        databaseType: input.databaseType,
        databaseMetadata: input.databaseMetadata,
        workspaceId: ctx.activeWorkspaceId,
      }).returning();

      if (!newIntegration) {
        throw new Error("Failed to create integration");
      }

      return newIntegration;
    }),

  setDatabaseMetadata: workspaceProtectedProcedure
    .input(z.object({
      databaseMetadata: databaseMetadataSchema
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const [updatedIntegration] = await db
          .update(integrationTable)
          .set({
            databaseMetadata: input.databaseMetadata,
          })
          .where(eq(integrationTable.workspaceId, ctx.activeWorkspaceId))
          .returning({
            id: integrationTable.id,
          });

        if (!updatedIntegration) {
          const [newMetadata] = await db
            .insert(integrationTable)
            .values({
              name: "Default Integration",
              databaseMetadata: input.databaseMetadata,
              workspaceId: ctx.activeWorkspaceId,
              type: "cloud",
            })
            .returning({
              id: integrationTable.id,
            });

          if (!newMetadata) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to set database metadata",
            });
          }

          return newMetadata;
        }

        return updatedIntegration;
      } catch (error) {
        console.error("Error setting database metadata:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set database metadata",
        });
      }
    }),

  deleteIntegration: workspaceProtectedProcedure
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const [deletedIntegration] = await db
        .delete(integrationTable)
        .where(eq(integrationTable.id, input.id))
        .returning();

      if (!deletedIntegration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      return deletedIntegration;
    }),

  updateIntegration: workspaceProtectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [updatedIntegration] = await db
        .update(integrationTable)
        .set({
          name: input.name,
        })
        .where(eq(integrationTable.id, input.id))
        .returning();

      if (!updatedIntegration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      return updatedIntegration;
    }),

  parseDatabaseMetadataWithAI: workspaceProtectedProcedure
    .input(z.object({
      description: z.string()
    }))
    .mutation(async ({ input }) => {
      const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: `
You are a database schema parser. You will take a natural language description of a database schema and convert it into a structured format.

The output must be valid JSON that matches the following TypeScript types:

type DatabaseMetadata = {
  dialect: ${DATABASE_TYPES.map(type => `"${type}"`).join(" | ")};
  projects: Project[];
}

type Project = {
  id: string;
  name: string; 
  description: string | null;
  datasets: Dataset[];
}

type Dataset = {
  id: string;
  name: string;
  description: string | null;
  tableCount: number;
  tables: Table[];
}

type Table = {
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
}

type Field = {
  name: string;
  type: string;
  description: string | null;
  fields?: Field[];
}

Here is an example of the expected output format:

{
  "dialect": "postgres",
  "projects": [
    {
      "id": "my-project",
      "name": "My Project",
      "description": "Example project",
      "datasets": [
        {
          "id": "main-dataset",
          "name": "Main Dataset",
          "description": "Primary dataset",
          "tableCount": 1,
          "tables": [
            {
              "id": "users",
              "name": "users",
              "description": "User information table",
              "fields": [
                {
                  "name": "id",
                  "type": "INTEGER",
                  "description": "Primary key"
                },
                {
                  "name": "email",
                  "type": "STRING",
                  "description": "User's email address"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

The user has provided the following description of their database schema:

<DESCRIPTION>
${input.description}
</DESCRIPTION>

Parse this description and return a structured schema that matches the example format above.
Generate appropriate IDs, names and descriptions based on the context provided.
The response must be valid JSON.

Do NOT surround the JSON with \`\`\` or anything else. It should be raw json. Start your response with "{"
`
      };

      const aiResponse = await getAIChatTextResponse({
        messages: [systemMessage]
      });

      const parsedResponse = JSON.parse(aiResponse);
      const databaseMetadata = databaseMetadataSchema.parse(parsedResponse);

      // Set includedInAIContext to true for all tables
      const metadataWithAIContext = {
        ...databaseMetadata,
        projects: databaseMetadata.projects.map(project => ({
          ...project,
          datasets: project.datasets.map(dataset => ({
            ...dataset,
            tables: dataset.tables.map(table => ({
              ...table,
              includedInAIContext: true
            }))
          }))
        }))
      };

      return metadataWithAIContext;
    }),
});
