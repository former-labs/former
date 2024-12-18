"use client";

import "@/styles/globals.css";

import { LayoutSidebar } from "@/components/navbar/layout-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Loading } from "@/components/utils/Loading";
import { useAuth } from "@/contexts/AuthContext";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isWorkspaceLoading, roles } = useAuth();

  const isLoading = isWorkspaceLoading && roles.length === 0;

  return (
    <SidebarProvider>
      <LayoutSidebar>
        <div className="h-full w-full">
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
  );
};

export default MainLayout;
