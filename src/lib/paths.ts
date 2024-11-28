/*
  Functions to return the paths for the app.

  In my experience this file becomes very convenient as the app grows.
*/

export const PATH_HOME = "/";

export const PATH_LOGIN = "/login";
export const PATH_SIGNUP = "/signup";

export const PATH_CHAT = "/chat";

export const PATH_CONVERSATION_SINGLE = (conversationId: string) =>
  `/chat/${conversationId}`;

export const PATH_DASHBOARD = "/dashboard";
export const PATH_DASHBOARD_SINGLE = (dashboardId: string) => `/dashboard/${dashboardId}`;

export const PATH_ONBOARDING = "/onboarding";

export const PATH_GOOGLE_OAUTH_CALLBACK = "/auth/callback/";
