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
  initializeDriver: (integration: Integration) => Promise<string | undefined>;
  fetchMetadataIncremental: (connectionId: string) => Promise<void>;
  isLoadingDatasets: boolean;
  isLoadingTables: boolean;
  integrations: Integration[];
  addIntegration: (integration: Integration) => void;
  editIntegration: (id: string, updates: Integration) => void;
  removeIntegration: (id: string) => void;
  executeQuery: (query: string) => Promise<unknown>;
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

  useEffect(() => {
    if (!activeIntegration && integrations[0]) {
      setActiveIntegration(integrations[0]);
    }
  }, [integrations, activeIntegration]);

  const initializeDriver = async (integration: Integration) => {
    console.log("initializeDriver", integration);
    try {
      const config: DatabaseConfig = {
        id: integration.id ?? crypto.randomUUID(),
        type: integration.type,
        projectId: integration.id ?? undefined,
        credentials: integration.credentials,
      };

      console.log("config", config);
      const result = await window.electron.database.connect(config);
      console.log("result", result);

      if (!result.success) {
        throw new Error(result.error);
      } else {
        return result.connectionId;
      }
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      throw error;
    }
  };

  const fetchMetadataIncremental = async (connectionId: string) => {
    console.log("fetchMetadataIncremental", connectionId);
    if (!connectionId || isFetchingMetadata) return;

    try {
      setIsFetchingMetadata(true);
      console.log("Fetching metadata for", connectionId);
      const metadata = await window.electron.database.getMetadata(connectionId);
      setWarehouseMetadata(metadata as WarehouseMetadata);
      console.log("metadata", metadata);
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
      console.log("activeIntegration", activeIntegration);
      initializeDriver(activeIntegration)
        .then((connectionId) => {
          if (connectionId) {
            void fetchMetadataIncremental(connectionId);
          }
        })
        .catch(console.error);
    }

    return () => {
      // Cleanup connection on unmount or integration change
      if (activeIntegration?.id) {
        void window.electron.database.disconnect(activeIntegration.id);
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
    console.log("newIntegration", newIntegration);
    setActiveIntegration(newIntegration);
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

  const executeQuery = async (query: string) => {
    if (!activeIntegration?.id) {
      throw new Error("No active integration");
    }

    try {
      const result = await window.electron.database.execute(
        activeIntegration.id,
        query,
      );
      return result;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
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
        executeQuery,
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
