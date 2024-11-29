"use client";

import "@/styles/globals.css";

import { LayoutSidebar } from "@/components/navbar/layout-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarRightProvider } from "@/components/ui/sidebar-right";
import { Loading } from "@/components/utils/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isLoadingGoogleAccounts, accounts } = useGoogleAnalytics();
  const { isWorkspaceLoading, roles } = useAuth();

  const isLoading =
    (isLoadingGoogleAccounts && accounts.length === 0) ||
    (isWorkspaceLoading && roles.length === 0);

  return (
    <SidebarRightProvider>
      <SidebarProvider>
        <LayoutSidebar>
          <div className="h-full w-full pt-4">
            {isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loading />
              </div>
            ) : (
              children
            )}
          </div>
        </LayoutSidebar>
      </SidebarProvider>
    </SidebarRightProvider>
  );
}
