"use server";

import { env } from "@/env";
import { PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { type Provider } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";


export async function loginWithProvider({
  provider,
  redirectTo = `${env.DASHBOARD_URI}${PATH_GOOGLE_INTEGRATION_OAUTH_CALLBACK}`,
  isElectron = false,
}: {
  provider: Provider;
  redirectTo?: string;
  isElectron?: boolean;
}) {
  const supabase = await createClient();

  console.log("IS ELECTRON", isElectron);
  console.log("LOGIN WITH PROVIDER", provider, redirectTo);

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: isElectron,
    },
  });

  if (error) {
    return error.message;
  }

  if (isElectron && data.url) {
    console.log("SENDING OPEN EXTERNAL", data.url);
    return { url: data.url };
  }

  revalidatePath("/", "layout");
  redirect(data.url);
}
