import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { AuthProvider } from "@/contexts/AuthContext";
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
        <TRPCReactProvider>
          <AuthProvider>{children}</AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
