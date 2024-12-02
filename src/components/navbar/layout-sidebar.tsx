"use client";

import { PropertySwitcher } from "@/components/analytics/property-switcher";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { LeftSidebar } from "./left-sidebar";
import { RightAppSidebar } from "./right-sidebar";

export function LayoutSidebar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LeftSidebar />
      <SidebarInset className="z-10">
        <header className="fixed z-10 flex h-12 w-full shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10">
          <div className="flex items-center gap-2 rounded-lg px-4">
            <SidebarTrigger className="-ml-1 bg-background p-4" />
            <PropertySwitcher />
            {/* <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>
          {/* <div className="px-4">
            <SidebarRightTrigger />
          </div> */}
        </header>
        {children}
      </SidebarInset>
      <RightAppSidebar />
    </>
  );
}
