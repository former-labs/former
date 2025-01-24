import { getAIChatTextResponse } from "@/server/ai/openai";
import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { databaseMetadataTable } from "@/server/db/schema";
import { databaseMetadataSchema } from "@/types/connections";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

export const databaseMetadataRouter = createTRPCRouter({
  getDatabaseMetadata: workspaceProtectedProcedure
    .query(async ({ ctx }) => {
      const metadata = await db
        .select()
        .from(databaseMetadataTable)
        .where(eq(databaseMetadataTable.workspaceId, ctx.activeWorkspaceId))
        .limit(1);

      const metadataItem = metadata[0];

      if (!metadataItem) {
        return null;
      }

      return metadataItem.databaseMetadata;
    }),

  setDatabaseMetadata: workspaceProtectedProcedure
    .input(z.object({
      databaseMetadata: databaseMetadataSchema
    }))
    .mutation(async ({ input, ctx }) => {
      const [updatedMetadata] = await db
        .update(databaseMetadataTable)
        .set({
          databaseMetadata: input.databaseMetadata,
        })
        .where(eq(databaseMetadataTable.workspaceId, ctx.activeWorkspaceId))
        .returning({
          id: databaseMetadataTable.id
        });

      if (!updatedMetadata) {
        const [newMetadata] = await db
          .insert(databaseMetadataTable)
          .values({
            databaseMetadata: input.databaseMetadata,
            workspaceId: ctx.activeWorkspaceId
          })
          .returning({
            id: databaseMetadataTable.id
          });

        if (!newMetadata) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to set database metadata'
          });
        }

        return newMetadata;
      }

      return updatedMetadata;
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

      return databaseMetadataSchema.parse(JSON.parse(aiResponse));
    }),
});
