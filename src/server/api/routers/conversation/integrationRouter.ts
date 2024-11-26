import { env } from "@/env";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";



export const integrationRouter = createTRPCRouter({
  connectGoogleAnalytics: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create state JWT
      try {
        const state = jwt.sign(
          {
          workspaceId: input.workspaceId,
          userId: ctx.user.id,
          timestamp: Date.now(),
        },
        env.OAUTH_CALLBACK_SECRET,
        { expiresIn: "1h" }
      );

      const REQUIRED_SCOPES = [
        'https://www.googleapis.com/auth/analytics.readonly',
      ];

      // Construct OAuth URL
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", env.GOOGLE_OAUTH_CLIENT_ID);
      authUrl.searchParams.append("redirect_uri", env.GOOGLE_OAUTH_REDIRECT_URI);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");
      authUrl.searchParams.append(
        "scope",
        REQUIRED_SCOPES.join(" "),
      );
      authUrl.searchParams.append("state", state);

        return {
          redirectUrl: authUrl.toString()
        };
      } catch (error) {
        console.error("Failed to connect Google Analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect Google Analytics",
        });
      }
    }),
});
