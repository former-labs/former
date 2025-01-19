import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { instructionsTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const instructionsRouter = createTRPCRouter({
  getInstructions: workspaceProtectedProcedure
    .query(async ({ ctx }) => {
      const instructions = await db
        .select()
        .from(instructionsTable)
        .where(eq(instructionsTable.workspaceId, ctx.activeWorkspaceId))
        .limit(1);

      const instructionsItem = instructions[0];

      if (!instructionsItem) {
        return '';
      }

      return instructionsItem.instructions;
    }),

  setInstructions: workspaceProtectedProcedure
    .input(z.object({
      instructions: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const [updatedInstructions] = await db
        .update(instructionsTable)
        .set({
          instructions: input.instructions,
        })
        .where(eq(instructionsTable.workspaceId, ctx.activeWorkspaceId))
        .returning({
          id: instructionsTable.id
        });

      if (!updatedInstructions) {
        const [newInstructions] = await db
          .insert(instructionsTable)
          .values({
            instructions: input.instructions,
            workspaceId: ctx.activeWorkspaceId
          })
          .returning({
            id: instructionsTable.id
          });

        if (!newInstructions) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to set instructions'
          });
        }

        return newInstructions;
      }

      return updatedInstructions;
    }),
});
