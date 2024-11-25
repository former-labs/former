/*
  Functions to return the paths for the app.

  In my experience this file becomes very convenient as the app grows.
*/

export const PATH_CHAT = "/chat";

export const PATH_CONVERSATION_SINGLE = (conversationId: string) =>
  `/chat/${conversationId}`;

export const PATH_DASHBOARD = "/dashboard";
