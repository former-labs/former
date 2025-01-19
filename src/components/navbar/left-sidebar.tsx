"use client";

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Code,
  Command,
  Database,
  FileText,
  GalleryVerticalEnd,
  Plug,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import * as React from "react";

import { MetadataTree } from "@/components/navbar/metadata-tree/metadata-tree";
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
import {
  PATH_EDITOR,
  PATH_INSTRUCTIONS,
  PATH_INTEGRATIONS,
  PATH_KNOWLEDGE,
} from "@/lib/paths";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  workspaces: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Workspace",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  sections: [
    {
      name: "Editor",
      url: PATH_EDITOR,
      icon: Code,
    },
    {
      name: "Integrations",
      url: PATH_INTEGRATIONS,
      icon: Plug,
    },
    {
      name: "AI Instructions",
      url: PATH_INSTRUCTIONS,
      icon: FileText,
    },
    {
      name: "AI Knowledge",
      url: PATH_KNOWLEDGE,
      icon: Database,
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
