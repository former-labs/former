import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { databaseMetadataTable } from "@/server/db/schema";
import { databaseMetadataSchema } from "@/types/connections";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
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
});
