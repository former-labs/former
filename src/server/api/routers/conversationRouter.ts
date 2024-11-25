import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { conversationTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const conversationRouter = createTRPCRouter({
  getConversation: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversations = await ctx.db
        .select()
        .from(conversationTable)
        .where(eq(conversationTable.id, input.conversationId));

      return conversations[0] ?? null;
    }),
});
