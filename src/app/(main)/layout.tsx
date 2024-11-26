import "@/styles/globals.css";

import { LayoutSidebar } from "@/components/navbar/layout-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarRightProvider } from "@/components/ui/sidebar-right";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarRightProvider>
      <SidebarProvider>
        <LayoutSidebar>{children}</LayoutSidebar>
      </SidebarProvider>
    </SidebarRightProvider>
  );
}
