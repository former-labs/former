import { createTRPCRouter, workspaceProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { knowledgeTable } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const knowledgeRouter = createTRPCRouter({
  listKnowledge: workspaceProtectedProcedure
    .query(async ({ ctx }) => {
      const knowledge = await db
        .select()
        .from(knowledgeTable)
        .where(eq(knowledgeTable.workspaceId, ctx.activeWorkspaceId))
        .orderBy(knowledgeTable.name);

      return knowledge;
    }),

  getKnowledge: workspaceProtectedProcedure
    .input(z.object({
      knowledgeId: z.string().uuid()
    }))
    .query(async ({ input, ctx }) => {
      const knowledge = await db
        .select()
        .from(knowledgeTable)
        .where(
          and(
            eq(knowledgeTable.id, input.knowledgeId),
            eq(knowledgeTable.workspaceId, ctx.activeWorkspaceId)
          )
        )
        .limit(1);

      const knowledgeItem = knowledge[0];

      if (!knowledgeItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Knowledge not found or not authorized to access'
        });
      }

      return knowledgeItem;
    }),

  createKnowledge: workspaceProtectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        query: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [newKnowledge] = await db
        .insert(knowledgeTable)
        .values({
          name: input.name,
          description: input.description,
          query: input.query,
          workspaceId: ctx.activeWorkspaceId
        })
        .returning({
          id: knowledgeTable.id
        });

      if (!newKnowledge) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create knowledge'
        });
      }

      return newKnowledge;
    }),

  updateKnowledge: workspaceProtectedProcedure
    .input(
      z.object({
        knowledgeId: z.string().uuid(),
        name: z.string(),
        description: z.string(),
        query: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [updatedKnowledge] = await db
        .update(knowledgeTable)
        .set({
          name: input.name,
          description: input.description,
          query: input.query,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(knowledgeTable.id, input.knowledgeId),
            eq(knowledgeTable.workspaceId, ctx.activeWorkspaceId)
          )
        )
        .returning({
          id: knowledgeTable.id
        });

      if (!updatedKnowledge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Knowledge not found or not authorized to update'
        });
      }

      return updatedKnowledge;
    }),

  deleteKnowledge: workspaceProtectedProcedure
    .input(z.object({
      knowledgeId: z.string().uuid()
    }))
    .mutation(async ({ input, ctx }) => {
      const [deletedKnowledge] = await db
        .delete(knowledgeTable)
        .where(
          and(
            eq(knowledgeTable.id, input.knowledgeId),
            eq(knowledgeTable.workspaceId, ctx.activeWorkspaceId)
          )
        )
        .returning({
          id: knowledgeTable.id
        });

      if (!deletedKnowledge) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Knowledge not found or not authorized to delete'
        });
      }

      return deletedKnowledge;
    }),
});
