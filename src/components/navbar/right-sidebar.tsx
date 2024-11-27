"use client";

import {
  SidebarContent,
  SidebarRight,
  useSidebar,
} from "@/components/ui/sidebar-right";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom";
import { create } from "zustand";

export function RightAppSidebar({
  ...props
}: React.ComponentProps<typeof SidebarRight>) {
  const { setOpen } = useSidebar();
  const { activeKey, setActiveKey } = useRightSidebarStore();
  const pathname = usePathname();

  // Close the sidebar when the active key is null
  useEffect(() => {
    setOpen(activeKey !== null);
  }, [activeKey, setOpen]);

  // Reset active key when pathname changes
  useEffect(() => {
    setActiveKey(null);
  }, [pathname, setActiveKey]);

  return (
    <SidebarRight side="right" collapsible="offcanvas" {...props}>
      <SidebarContent>
        <div id="sidebar-root"></div>
      </SidebarContent>
    </SidebarRight>
  );
}

export const RightSidebarPortal = ({
  nodeKey,
  children,
}: {
  nodeKey: string;
  children: React.ReactNode;
}) => {
  // We only render a child if it is active
  const { activeKey } = useRightSidebarStore();
  if (activeKey !== nodeKey) {
    return null;
  }

  const sidebarRoot = document.getElementById("sidebar-root");
  if (!sidebarRoot) {
    return null;
  }
  return ReactDOM.createPortal(children, sidebarRoot);
};

const useRightSidebarStore = create<{
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
}>((set) => ({
  activeKey: null,
  setActiveKey: (key) => set({ activeKey: key }),
}));

export const useRightSidebar = () => {
  const { activeKey, setActiveKey } = useRightSidebarStore();

  return {
    activeKey,
    setActiveKey,
  };
};
