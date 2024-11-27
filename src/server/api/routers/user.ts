import { db } from "@/server/db";
import { createTRPCRouter, userProtectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getRoles: userProtectedProcedure.query(async ({ ctx }) => {
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
  
}); 