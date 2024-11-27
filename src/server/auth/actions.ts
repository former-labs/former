"use server";

import { PATH_GOOGLE_OAUTH_CALLBACK } from "@/lib/paths";
import { createClient } from "@/lib/supabase/server";
import { type Provider } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";


export async function loginWithProvider({
  provider,
}: {
  provider: Provider;
}) {
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const redirectTo = `${origin}${PATH_GOOGLE_OAUTH_CALLBACK}`;

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
