import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/server/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user?.email)) {
    return (
      <div>
        <div>You are not admin.</div>
        <div>Email: {user?.email}</div>
      </div>
    );
  }

  return <>{children}</>;
}
