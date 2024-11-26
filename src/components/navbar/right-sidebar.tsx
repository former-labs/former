"use client";

import {
  SidebarContent,
  SidebarRail,
  SidebarRight,
  useSidebar,
} from "@/components/ui/sidebar-right";
import * as React from "react";
import { create } from "zustand";
import { SidebarGoogleAnalyticsReportEditor } from "./googleAnalyticsReportEditor/SidebarGoogleAnalyticsReportEditor";

export function RightAppSidebar({
  ...props
}: React.ComponentProps<typeof SidebarRight>) {
  const { googleAnalyticsReportId, closeGoogleAnalyticsReport } =
    useRightSidebar();

  return (
    <SidebarRight side="right" collapsible="offcanvas" {...props}>
      <SidebarContent>
        {googleAnalyticsReportId ? (
          <SidebarGoogleAnalyticsReportEditor
            googleAnalyticsReportId={googleAnalyticsReportId}
            onClose={closeGoogleAnalyticsReport}
          />
        ) : (
          <div>Nothing to see here...</div>
        )}
      </SidebarContent>
      <SidebarRail />
    </SidebarRight>
  );
}

const useRightSidebarStore = create<{
  googleAnalyticsReportId: string | null;
  setGoogleAnalyticsReportId: (id: string | null) => void;
}>((set) => ({
  googleAnalyticsReportId: null,
  setGoogleAnalyticsReportId: (id) => set({ googleAnalyticsReportId: id }),
}));

// Some of this logic should maybe just exist inside the RightAppSidebar component...?
export const useRightSidebar = () => {
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const { googleAnalyticsReportId, setGoogleAnalyticsReportId } =
    useRightSidebarStore();

  const openGoogleAnalyticsReport = React.useCallback(
    (id: string) => {
      setGoogleAnalyticsReportId(id);
      if (isMobile) {
        setOpenMobile(true);
      } else {
        setOpen(true);
      }
    },
    [isMobile, setOpen, setOpenMobile, setGoogleAnalyticsReportId],
  );

  const closeGoogleAnalyticsReport = React.useCallback(() => {
    setGoogleAnalyticsReportId(null);
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  }, [isMobile, setOpen, setOpenMobile, setGoogleAnalyticsReportId]);

  return {
    openGoogleAnalyticsReport,
    closeGoogleAnalyticsReport,
    googleAnalyticsReportId,
  };
};
