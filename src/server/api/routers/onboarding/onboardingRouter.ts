import { createClient } from "@/lib/supabase/server";
import { createTRPCRouter, userProtectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { databaseMetadataTable, knowledgeTable, roleTable, RoleType, workspaceTable } from "@/server/db/schema";
import type { Integration } from "@/types/connections";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { DEMO_CREDENTIALS } from "./demoCredentials";
import { DEMO_DATABASE_METADATA, DEMO_QUERIES } from "./demoData";

const createWorkspaceAndRole = async ({
  workspaceName,
  userId,
  tx,
  isDemoWorkspace = false
}: {
  workspaceName: string;
  userId: string;
  tx: typeof db;
  isDemoWorkspace?: boolean;
}) => {
  // 1. Create workspace
  const [newWorkspace] = await tx
    .insert(workspaceTable)
    .values({
      name: workspaceName,
      demo: isDemoWorkspace,
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
      userId: userId,
      roleType: RoleType.OWNER,
    })
    .returning({
      id: roleTable.id,
    });

  if (!newRole) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create role'
    });
  }

  const newRoleWithRelations = await tx.query.roleTable.findFirst({
    where: (role, { eq }) => eq(role.id, newRole.id),
    with: {
      workspace: true,
      user: true,
    },
  });

  if (isDemoWorkspace) {
    // Initialize demo queries
    const demoQueries = await tx.insert(knowledgeTable).values(
      DEMO_QUERIES.map(query => ({
        workspaceId: newWorkspace.id,
        name: query.name,
        description: query.description,
        query: query.query
      }))
    ).returning();

    if (!demoQueries || demoQueries.length === 0) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create demo queries'
      });
    }

    // Initialize demo database metadata
    const [databaseMetadata] = await tx
      .insert(databaseMetadataTable)
      .values({
        workspaceId: newWorkspace.id,
        databaseMetadata: DEMO_DATABASE_METADATA
      })
      .returning();

    if (!databaseMetadata) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create database metadata'
      });
    }
  }

  return newRoleWithRelations;
};

export const onboardingRouter = createTRPCRouter({
  createWorkspace: userProtectedProcedure
    .input(
      z.object({
        workspaceName: z.string().min(3, "Workspace name must be at least 3 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // const role = await db.transaction(async (tx) => {
        //   return await createWorkspaceAndRole({
        //     workspaceName: input.workspaceName,
        //     userId: ctx.user.id,
        //     tx
        //   });
        // });

        const role = await createWorkspaceAndRole({
          workspaceName: input.workspaceName,
          userId: ctx.user.id,
          tx: db
        });

        return { role };
      } catch (error) {
        console.error('Onboarding error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create workspace',
          cause: error,
        });
      }
    }),

  createDemoWorkspace: userProtectedProcedure
    .mutation(async ({ ctx }) => {
      const demoRole = await createWorkspaceAndRole({
        workspaceName: "Demo Workspace",
        userId: ctx.user.id,
        tx: db,
        isDemoWorkspace: true
      });

      // Create the Supabase client and update auth metadata
      const supabase = await createClient();
      await supabase.auth.updateUser({
        data: { onboarding_complete: true }
      });

      return { role: demoRole };

      // try {
      //   const role = await db.transaction(async (tx) => {
      //     const demoRole = await createWorkspaceAndRole({
      //       workspaceName: "Demo Workspace",
      //       userId: ctx.user.id,
      //       tx,
      //       isDemoWorkspace: true
      //     });

      //     return demoRole;
      //   });

      //   // Create the Supabase client and update auth metadata
      //   const supabase = await createClient();
      //   await supabase.auth.updateUser({
      //     data: { onboarding_complete: true }
      //   });

      //   return { role };
      // } catch (error) {
      //   console.error('Demo workspace creation error:', error);
      //   throw new TRPCError({
      //     code: 'INTERNAL_SERVER_ERROR',
      //     message: error instanceof Error ? error.message : 'Failed to create demo workspace',
      //     cause: error,
      //   });
      // }
    }),

  retrieveDemoIntegration: userProtectedProcedure
    .query(async () => {
      const demoIntegration: Omit<Integration, "id" | "createdAt" | "workspaceId"> = {
        type: "bigquery",
        name: "Demo BigQuery Integration",
        credentials: DEMO_CREDENTIALS,
        config: {
          projectId: "former-prod"
        },
        demo: true
      };

      return demoIntegration;
    }),
});
