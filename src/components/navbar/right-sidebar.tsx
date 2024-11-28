"use client";

import {
  SidebarContent,
  SidebarRight,
  useSidebar,
} from "@/components/ui/sidebar-right";
import * as React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom";
import { create } from "zustand";

const useRightSidebarStore = create<{
  isComponentProvided: boolean;
  setIsComponentProvided: (isActive: boolean) => void;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
}>((set) => ({
  isComponentProvided: false,
  setIsComponentProvided: (isActive) => set({ isComponentProvided: isActive }),
  activeKey: null,
  setActiveKey: (key) => set({ activeKey: key }),
}));

export function RightAppSidebar({
  ...props
}: React.ComponentProps<typeof SidebarRight>) {
  const { setOpen } = useSidebar();
  const { isComponentProvided } = useRightSidebarStore();

  // Close the sidebar when nothing is provided
  useEffect(() => {
    setOpen(isComponentProvided);
  }, [isComponentProvided, setOpen]);

  return (
    <SidebarRight side="right" collapsible="offcanvas" {...props}>
      <SidebarContent>
        <div id="sidebar-root"></div>
      </SidebarContent>
    </SidebarRight>
  );
}

export const RightSidebarPortal = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { setIsComponentProvided } = useRightSidebarStore();

  useEffect(() => {
    setIsComponentProvided(true);
    return () => {
      setIsComponentProvided(false);
    };
  }, [setIsComponentProvided]);

  const sidebarRoot = document.getElementById("sidebar-root");
  if (!sidebarRoot) {
    return null;
  }

  return ReactDOM.createPortal(children, sidebarRoot);
};

export const useRightSidebar = () => {
  const { isComponentProvided } = useRightSidebarStore();

  return {
    isComponentProvided,
  };
};

/*
  Hmm idk if this is a good idea.

  The idea is that we provide some kind of shared lock for the sidebar
  in the form of a unique key each user can set.

  This means one component can take control of the sidebar which will
  notify any other components which are using the sidebar so they can
  stop rendering their portal.

  Tbh we could also move the conditional rendering aspect of the portal inside
  the portal component above.
*/
export const useRightSidebarLock = (
  key: string,
): [boolean, (active: boolean) => void] => {
  const { activeKey, setActiveKey } = useRightSidebarStore();

  const isActive = activeKey === key;

  const setIsActive = (active: boolean) => {
    if (active) {
      setActiveKey(key);
    } else if (activeKey === key) {
      setActiveKey(null);
    }
  };

  return [isActive, setIsActive];
};
