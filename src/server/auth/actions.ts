"use server";

import { env } from "@/env";
import { PATH_GOOGLE_OAUTH_CALLBACK } from "@/lib/paths";
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
  const redirectTo = `${env.DASHBOARD_URI}${PATH_GOOGLE_OAUTH_CALLBACK}`;

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    return error.message;
  } else {
    revalidatePath("/", "layout");
    redirect(data.url);
  }
}
