"use client";

import { api } from "@/trpc/react";
import React, { createContext, useContext, useEffect, useState } from "react";

type GoogleAnalyticsProperty = {
  propertyId: string;
  name: string;
};

type GoogleAnalyticsAccount = {
  projectId: string;
  name: string;
  properties: GoogleAnalyticsProperty[];
};

type GoogleAnalyticsContextType = {
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
  const [accounts, setAccounts] = useState<GoogleAnalyticsAccount[]>([]);
  const [activeProperty, setActiveProperty] =
    useState<GoogleAnalyticsProperty | null>(null);

  const { data: analyticsData, isLoading: isLoadingGoogleAccounts } =
    api.googleAnalytics.getAccounts.useQuery();

  useEffect(() => {
    if (analyticsData) {
      setAccounts(analyticsData);
      if (analyticsData[0]?.properties[0] && !activeProperty) {
        setActiveProperty(analyticsData[0].properties[0]);
      }
    }
  }, [analyticsData]);

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
