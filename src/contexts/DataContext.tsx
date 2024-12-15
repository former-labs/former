"use client";

import type { IntegrationSelect } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export interface WarehouseMetadata {
  projects?: {
    id: string;
    name: string;
    datasets: {
      id: string;
      name: string;
      tables: {
        id: string;
        name: string;
        fields: {
          name: string;
          type: string;
          description?: string;
        }[];
      }[];
    }[];
  }[];
}

interface DataContextType {
  activeIntegration: IntegrationSelect | null;
  setActiveIntegration: (integration: IntegrationSelect | null) => void;
  integrations: IntegrationSelect[];
  isLoadingIntegrations: boolean;
  warehouseMetadata: WarehouseMetadata | null;
  isLoadingMetadata: boolean;
}

const DataContext = createContext<DataContextType | undefined>({
  activeIntegration: null,
  setActiveIntegration: () => null,
  integrations: [],
  isLoadingIntegrations: true,
  warehouseMetadata: null,
  isLoadingMetadata: true,
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { activeRole } = useAuth();
  const [activeIntegration, setActiveIntegration] =
    useState<IntegrationSelect | null>(null);
  const [warehouseMetadata, setWarehouseMetadata] =
    useState<WarehouseMetadata | null>(null);

  const { data: integrations = [], isLoading: isLoadingIntegrations } =
    api.integration.listIntegrations.useQuery(undefined, {
      enabled: !!activeRole,
    });

  const { data: metadata, isLoading: isLoadingMetadata } =
    api.integration.getWarehouseMetadata.useQuery(
      { integrationId: activeIntegration?.id ?? "" },
      { enabled: !!activeIntegration },
    );

  useEffect(() => {
    if (!activeIntegration && integrations[0]) {
      setActiveIntegration(integrations[0]);
    }
  }, [integrations, activeIntegration]);

  useEffect(() => {
    if (metadata) {
      setWarehouseMetadata(metadata);
    }
  }, [metadata]);

  return (
    <DataContext.Provider
      value={{
        activeIntegration,
        setActiveIntegration,
        integrations,
        isLoadingIntegrations,
        warehouseMetadata,
        isLoadingMetadata,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
