"use client";

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarRight,
} from "@/components/ui/sidebar-right";
import * as React from "react";

export function RightAppSidebar({
  ...props
}: React.ComponentProps<typeof SidebarRight>) {
  return (
    <SidebarRight side="right" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        {/* <WorkspaceSwitcher workspaces={data.workspaces} /> */}
        <div>hello header sir</div>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <div>hello</div>
        {/* <NavPages pages={data.sections} /> */}
      </SidebarContent>
      <SidebarFooter>
        <div>footer time</div>
        {/* <NavUser /> */}
      </SidebarFooter>
      <SidebarRail />
    </SidebarRight>
  );
}
