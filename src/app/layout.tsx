import "@/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { LeftSidebar } from "@/components/navbar/left-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "Werve",
  description: "Werve",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <ClerkProvider>
          <TRPCReactProvider>
            <SidebarProvider>
              <LeftSidebar>{children}</LeftSidebar>
            </SidebarProvider>
          </TRPCReactProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
