"use client";

import { LeftSidebar } from "@/components/navbar/left-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { SidebarRightProvider } from "./ui/sidebar-right";

export function RouteWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isOnboarding) {
    return children;
  }

  return (
    <SidebarRightProvider>
      <SidebarProvider>
        <LeftSidebar>{children}</LeftSidebar>
      </SidebarProvider>
    </SidebarRightProvider>
  );
}
