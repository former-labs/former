import "@/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { RouteWrapper } from "@/components/route-wrapper";
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
            <RouteWrapper>{children}</RouteWrapper>
          </TRPCReactProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
