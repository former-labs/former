import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { dashboardTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dashboardRouter = createTRPCRouter({
  createDashboard: publicProcedure.mutation(async ({ ctx }) => {
    const [dashboard] = await ctx.db
      .insert(dashboardTable)
      .values({
        title: "Untitled dashboard",
        description: null,
      })
      .returning();

    if (!dashboard) {
      throw new Error("Failed to create dashboard");
    }

    return {
      dashboardId: dashboard.id,
    };
  }),

  listDashboards: publicProcedure.query(async ({ ctx }) => {
    const dashboards = await ctx.db
      .select()
      .from(dashboardTable)
      .orderBy(dashboardTable.title);

    return dashboards;
  }),

  getDashboard: publicProcedure
    .input(z.object({ dashboardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const dashboard = await ctx.db.query.dashboardTable.findFirst({
        where: eq(dashboardTable.id, input.dashboardId),
      });

      if (!dashboard) {
        throw new Error("Dashboard not found");
      }

      return dashboard;
    }),
});
