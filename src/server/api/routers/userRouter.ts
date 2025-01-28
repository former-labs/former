import { type ActiveRole } from "@/contexts/AuthContext";
import { env } from "@/env";
import { db } from "@/server/db";
import { userTable } from "@/server/db/schema";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authUserProcedure, createTRPCRouter, userProtectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  createUser: authUserProcedure
    .mutation(async ({ ctx }) => {
      // Check if user already exists
      const existingUser = await db.query.userTable.findFirst({
        where: (user, { eq }) => eq(user.supabaseAuthId, ctx.auth.id)
      });

      if (existingUser) {
        return existingUser;
      }

      // Create new user
      const nameParts = ctx.auth.user_metadata?.full_name?.split(' ') ?? [];
      const [newUser] = await db.insert(userTable).values({
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' '),
        email: ctx.auth.email ?? '',
        supabaseAuthId: ctx.auth.id,
      }).returning();

      return newUser;
    }),

  getRoles: userProtectedProcedure
    .query(async ({ ctx }) => {
      const roles = await db.query.roleTable.findMany({
        where: (role, { eq }) => eq(role.userId, ctx.user.id),
        with: {
          workspace: true,
          user: true,
        },
        orderBy: (role, { desc }) => [desc(role.createdAt)],
      });

      return roles;
    }),

  setActiveRole: userProtectedProcedure
    .input(z.object({
      roleId: z.string(),
      workspaceId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const role = await db.query.roleTable.findFirst({
        where: (role, { and, eq }) => and(
          eq(role.workspaceId, input.workspaceId),
          eq(role.userId, ctx.user.id),
          eq(role.id, input.roleId)
        ),
      });

      if (!role) {
        throw new Error("User does not have access to this workspace");
      }

      const activeRole: ActiveRole = {
        id: role.id,
        workspaceId: role.workspaceId,
        roleType: role.roleType,
      };

      const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_API_KEY,
      );

      const { error } = await supabase.auth.admin.updateUserById(
        ctx.auth.id,
        { 
          app_metadata: { 
            ...ctx.auth.app_metadata,
            activeRole
          } 
        }
      );

      if (error) {
        throw error;
      }

      return { success: true };
    }),
});