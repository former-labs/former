"use server";

import { env } from "@/env";
import { PATH_ELECTRON_CALLBACK, PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { type Provider } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


export async function loginWithProvider({
  provider,
}: {
  provider: Provider;
}) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.DASHBOARD_URI}${PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK}`,
    },
  });

  if (error) {
    return error.message;
  }

  revalidatePath("/", "layout");
  redirect(data.url);
}

export async function loginWithProviderElectron({
  provider,
}: {
  provider: Provider;
}) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.DASHBOARD_URI}${PATH_ELECTRON_CALLBACK}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { error: error?.message || "Failed to authenticate with service" };
  }

  console.log("SENDING OPEN EXTERNAL", data.url);
  return { url: data.url };
}
