"use client";

import "@/styles/globals.css";

import { LayoutSidebar } from "@/components/navbar/layout-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarRightProvider } from "@/components/ui/sidebar-right";
import { Loading } from "@/components/utils/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoadingIntegrations, integrations } = useData();
  const { isWorkspaceLoading, roles } = useAuth();

  const isLoading =
    (isLoadingIntegrations && integrations.length === 0) ||
    (isWorkspaceLoading && roles.length === 0);

  return (
    <SidebarRightProvider>
      <SidebarProvider>
        <LayoutSidebar>
          <div className="h-full w-full px-8 pt-8">
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
};

export default MainLayout;
