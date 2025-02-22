import "@/styles/globals.css";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { env } from "@/env";
import { TRPCReactProvider } from "@/trpc/react";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import Script from "next/script";
import { ElectronAuthHandler } from "./(auth)/_components/ElectronAuthHandler";

export const metadata: Metadata = {
  title: "Former",
  description:
    "The AI SQL Editor. Built to make data analysts extraordinarily productive, Former is the best way to write SQL with AI.",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        {env.NODE_ENV === "production" && env.SEND_ANALYTICS && (
          <>
            {/* Google Tag Manager */}
            <Script
              id="google-tag-manager"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TXZ4R597');`,
              }}
            />
            {/* End Google Tag Manager */}
          </>
        )}
      </head>
      <body>
        {env.NODE_ENV === "production" && env.SEND_ANALYTICS && (
          <>
            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-TXZ4R597"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
            {/* End Google Tag Manager (noscript) */}
          </>
        )}
        {env.NEXT_PUBLIC_PLATFORM === "desktop" && <ElectronAuthHandler />}
        <TRPCReactProvider>
          <AuthProvider>
            <DataProvider>{children}</DataProvider>
          </AuthProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
