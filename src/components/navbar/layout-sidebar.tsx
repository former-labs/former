"use client";

import { PropertySwitcher } from "@/components/analytics/property-switcher";
import { useGoogleAnalytics } from "@/contexts/GoogleAnalyticsContext";
import { SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import { LeftSidebar } from "./left-sidebar";
import { RightAppSidebar } from "./right-sidebar";

export function LayoutSidebar({ children }: { children: React.ReactNode }) {
  const { isLoadingGoogleAccounts } = useGoogleAnalytics();

  return (
    <>
      <LeftSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            {isLoadingGoogleAccounts ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <PropertySwitcher />
            )}
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
