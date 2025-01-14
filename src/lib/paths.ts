/*
  Functions to return the paths for the app.

  In my experience this file becomes very convenient as the app grows.
*/

export const PATH_HOME = "/";

export const PATH_LOGIN = "/login";
export const PATH_SIGNUP = "/signup";

export const PATH_CHAT = "/chat";
export const PATH_CONVERSATION_PENDING = "/chat";
export const PATH_CONVERSATION_SINGLE = (conversationId: string) =>
  `/chat/${conversationId}`;

export const PATH_ONBOARDING = "/onboarding";


export const PATH_EDITOR = "/editor";
export const PATH_INTEGRATIONS = "/integrations";
export const PATH_KNOWLEDGE = "/knowledge";

export const PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK = "/auth/callback/";
export const PATH_ELECTRON_CALLBACK = "/auth/electron/callback/";
export const PATH_YERVE_ELECTRON_APP = "yerve://";
