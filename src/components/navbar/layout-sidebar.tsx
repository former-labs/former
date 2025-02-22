"use client";

import { SidebarInset } from "../ui/sidebar";
import { LeftSidebar } from "./left-sidebar";

export function LayoutSidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LeftSidebar />
      <SidebarInset className="z-10 overflow-x-auto">
        {/* <header className="pointer-events-none fixed z-10 flex h-12 w-full shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10">
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg px-4">
            <SidebarTrigger className="-ml-1 bg-background p-4" />
          </div>
        </header> */}
        {children}
      </SidebarInset>
    </>
  );
}
