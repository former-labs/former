import { env } from "@/env";
import { getGoogleTokens } from "@/lib/googleAnalytics/helper";
import { PATH_ONBOARDING } from "@/lib/paths";
import { db } from "@/server/db";
import { integrationTable } from "@/server/db/schema";
import jwt from "jsonwebtoken";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectWithError = (errorType: string) => 
    Response.redirect(`${env.DASHBOARD_URI}${PATH_ONBOARDING}?error=${encodeURIComponent(errorType)}`);

  if (error) {
    console.error("OAuth error:", error);
    return redirectWithError(error);
  }

  if (!code || !state) {
    return redirectWithError("missing_params");
  }

  try {
    const { workspaceId, timestamp } = jwt.verify(state, env.OAUTH_CALLBACK_SECRET) as {
      workspaceId: string;
      userId: number;
      timestamp: number;
    };

    const tokenAge = Date.now() - timestamp;
    if (tokenAge > 1000 * 60 * 10) { // 10 minutes
      return redirectWithError("token_expired");
    }

    const { access_token, refresh_token, scope } = await getGoogleTokens(code);

    await db.insert(integrationTable).values({
      workspaceId,
      credentials: {
        scopes: scope.split(" "),
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      type: "google_analytics",
      metadata: {},
    });

    return Response.redirect(env.DASHBOARD_URI);
  } catch (error: any) {
    console.error("Callback error:", error);
      
    return redirectWithError("callback_failed");
  }
}