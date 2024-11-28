import "@/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAnalyticsProvider } from "@/contexts/GoogleAnalyticsContext";
import { TRPCReactProvider } from "@/trpc/react";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Werve",
  description: "Werve",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        {process.env.NODE_ENV === "production" && (
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
})(window,document,'script','dataLayer','GTM-T4Q55MB4');`,
              }}
            />
            {/* End Google Tag Manager */}
          </>
        )}
      </head>
      <body>
        {process.env.NODE_ENV === "production" && (
          <>
            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-T4Q55MB4"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
            {/* End Google Tag Manager (noscript) */}
          </>
        )}
        <TRPCReactProvider>
          <AuthProvider>
            <GoogleAnalyticsProvider>{children}</GoogleAnalyticsProvider>
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
