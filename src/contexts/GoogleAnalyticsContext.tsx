"use client";

import {
  type GoogleAnalyticsAccount,
  type GoogleAnalyticsProperty,
} from "@/lib/googleAnalytics/googleAnalyticsTypes";
import { api } from "@/trpc/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export type GoogleAnalyticsContextType = {
  isLoadingGoogleAccounts: boolean;
  accounts: GoogleAnalyticsAccount[];
  activeProperty: GoogleAnalyticsProperty | null;
  setActiveProperty: (property: GoogleAnalyticsProperty) => void;
};

const GoogleAnalyticsContext = createContext<GoogleAnalyticsContextType>({
  isLoadingGoogleAccounts: true,
  accounts: [],
  activeProperty: null,
  setActiveProperty: () => null,
});

export const GoogleAnalyticsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { activeRole } = useAuth();
  const [activeProperty, setActiveProperty] =
    useState<GoogleAnalyticsProperty | null>(null);

  const { data: accounts = [], isLoading: isLoadingGoogleAccounts } =
    api.googleAnalytics.getAccounts.useQuery(undefined, {
      enabled: !!activeRole,
    });

  useEffect(() => {
    if (!activeProperty && accounts[0]?.properties[0]) {
      setActiveProperty(accounts[0].properties[0]);
    }
  }, [accounts, activeProperty]);

  return (
    <GoogleAnalyticsContext.Provider
      value={{
        isLoadingGoogleAccounts,
        accounts,
        activeProperty,
        setActiveProperty,
      }}
    >
      {children}
    </GoogleAnalyticsContext.Provider>
  );
};

export const useGoogleAnalytics = () => useContext(GoogleAnalyticsContext);
