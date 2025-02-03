"use client";

import { NavPages } from "@/components/navbar/nav-pages";
import { NavUser } from "@/components/navbar/nav-user";
import { WorkspaceSwitcher } from "@/components/navbar/workspace-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { env } from "@/env";
import {
  PATH_DATABASE_METADATA,
  PATH_EDITOR,
  PATH_HELP,
  PATH_INSTRUCTIONS,
  PATH_INTEGRATIONS,
  PATH_KNOWLEDGE,
} from "@/lib/paths";
import {
  Code,
  Database,
  FileText,
  HelpCircle,
  Plug,
  ScrollText,
} from "lucide-react";
import * as React from "react";
import { MetadataTree } from "./metadata-tree/MetadataTree";

const data = {
  sections: [
    {
      name: "Editor",
      url: PATH_EDITOR,
      icon: Code,
    },
    ...(env.NEXT_PUBLIC_PLATFORM === "desktop"
      ? [
          {
            name: "Integrations",
            url: PATH_INTEGRATIONS,
            icon: Plug,
          },
        ]
      : []),
    ...(env.NEXT_PUBLIC_PLATFORM === "web"
      ? [
          {
            name: "Database Schema",
            url: PATH_DATABASE_METADATA,
            icon: Database,
          },
        ]
      : []),
    {
      name: "AI Instructions",
      url: PATH_INSTRUCTIONS,
      icon: FileText,
    },
    {
      name: "AI Knowledge",
      url: PATH_KNOWLEDGE,
      icon: ScrollText,
    },
    {
      name: "Help",
      url: PATH_HELP,
      icon: HelpCircle,
    },
  ],
};

export function LeftSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="flex flex-col">
        <NavPages pages={data.sections} />
        <div className="flex-1 overflow-y-auto">
          <MetadataTree />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
