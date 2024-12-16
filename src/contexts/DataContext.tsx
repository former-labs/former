"use client";

import { type Driver } from "@/electron/drivers/clients";
import type {
  DatabaseConfig,
  DatabaseCredentials,
  WarehouseMetadata,
} from "@/types/connections";
import { createContext, useContext, useEffect, useState } from "react";

export type Integration = {
  id: string | null;
  type: "bigquery" | "postgres";
  name: string;
  credentials: DatabaseCredentials;
  createdAt: string;
};

interface DataContextType {
  activeIntegration: Integration | null;
  setActiveIntegration: (integration: Integration | null) => void;
  warehouseMetadata: WarehouseMetadata | null;
  isFetchingMetadata: boolean;
  driver: Driver | null;
  initializeDriver: (integration: Integration) => Promise<void>;
  fetchMetadataIncremental: () => Promise<void>;
  isLoadingDatasets: boolean;
  isLoadingTables: boolean;
  integrations: Integration[];
  addIntegration: (integration: Integration) => void;
  editIntegration: (id: string, updates: Integration) => void;
  removeIntegration: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeIntegration, setActiveIntegration] =
    useState<Integration | null>(null);
  const [warehouseMetadata, setWarehouseMetadata] =
    useState<WarehouseMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeIntegration && integrations[0]) {
      setActiveIntegration(integrations[0]);
    }
  }, [integrations, activeIntegration]);

  const initializeDriver = async (integration: Integration) => {
    try {
      const config: DatabaseConfig = {
        id: integration.id ?? crypto.randomUUID(),
        type: integration.type,
        projectId: integration.id ?? undefined,
        credentials: integration.credentials,
      };

      const result = await window.electron.database.connect(config);

      if (!result.success) {
        throw new Error(result.error);
      }

      setConnectionId(result.connectionId ?? null);
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      throw error;
    }
  };

  const fetchMetadataIncremental = async () => {
    if (!connectionId || isFetchingMetadata) return;

    try {
      setIsFetchingMetadata(true);
      const metadata = await window.electron.database.getMetadata(connectionId);
      setWarehouseMetadata(metadata as WarehouseMetadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      throw error;
    } finally {
      setIsFetchingMetadata(false);
      setIsLoadingDatasets(false);
      setIsLoadingTables(false);
    }
  };

  // Initialize connection when integration changes
  useEffect(() => {
    if (activeIntegration) {
      initializeDriver(activeIntegration)
        .then(() => fetchMetadataIncremental())
        .catch(console.error);
    }

    return () => {
      // Cleanup connection on unmount or integration change
      if (connectionId) {
        window.electron.database.disconnect(connectionId).catch(console.error);
      }
    };
  }, [activeIntegration?.id]);

  const addIntegration = (
    integration: Omit<Integration, "id" | "createdAt">,
  ) => {
    const newIntegration: Integration = {
      ...integration,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setIntegrations((prev) => [...prev, newIntegration]);
  };

  const editIntegration = (id: string, updates: Integration) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              type: updates.type,
              name: updates.name,
              credentials: updates.credentials,
            }
          : integration,
      ),
    );
  };

  const removeIntegration = (id: string) => {
    setIntegrations((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        activeIntegration,
        setActiveIntegration,
        integrations,
        warehouseMetadata,
        isFetchingMetadata,
        driver: null,
        initializeDriver,
        fetchMetadataIncremental,
        isLoadingDatasets,
        isLoadingTables,
        addIntegration,
        editIntegration,
        removeIntegration,
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
