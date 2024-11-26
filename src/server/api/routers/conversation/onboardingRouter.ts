import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { roleTable, workspaceTable } from "@/server/db/schema";
import { clerk } from "@/server/utils/clerk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const onboardingRouter = createTRPCRouter({
  createWorkspace: protectedProcedure
    .input(
      z.object({
        workspaceName: z.string().min(3, "Workspace name must be at least 3 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Start a transaction for all our database operations
        const result = await db.transaction(async (tx) => {
          // 1. Create workspace
          const [newWorkspace] = await tx
            .insert(workspaceTable)
            .values({
              name: input.workspaceName,
            })
            .returning();

          if (!newWorkspace) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create workspace'
            });
          }

          // 2. Create role
          const [newRole] = await tx
            .insert(roleTable)
            .values({
              workspaceId: newWorkspace.id,
              userId: ctx.user.id,
              roleType: "owner",
            })
            .returning();

          if (!newRole) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create role'
            });
          }

          // Update Clerk metadata after role is created
          await clerk.users.updateUser(ctx.auth.id, {
            publicMetadata: {
              onboardingComplete: true
            }
          });

          // 3. Return the workspace UID and user ID
          return {
            workspaceId: newWorkspace.id,
            userId: ctx.user.id,
            roleId: newRole.id,
          };
        });

        return result;
      } catch (error) {
        console.error('Onboarding error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to complete onboarding',
          cause: error,
        });
      }
    }),
});
