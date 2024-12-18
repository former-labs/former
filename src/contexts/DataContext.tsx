"use client";

import { type Driver } from "@/electron/drivers/clients";
import {
  databaseMetadataSchema,
  type DatabaseMetadata,
  type Integration,
} from "@/types/connections";
import { createContext, useContext, useEffect, useState } from "react";

interface DataContextType {
  activeIntegration: Integration | null;
  setActiveIntegration: (integration: Integration | null) => void;
  databaseMetadata: DatabaseMetadata | null;
  isFetchingMetadata: boolean;
  driver: Driver | null;
  initializeDriver: (integration: Integration) => Promise<string | undefined>;
  fetchMetadataIncremental: (connectionId: string) => Promise<void>;
  isLoadingDatasets: boolean;
  isLoadingTables: boolean;
  integrations: Integration[];
  addIntegration: (integration: Omit<Integration, "id" | "createdAt">) => void;
  editIntegration: (
    id: string,
    updates: Omit<Integration, "id" | "createdAt">,
  ) => void;
  removeIntegration: (id: string) => void;
  executeQuery: (query: string) => Promise<unknown>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeIntegration, setActiveIntegration] =
    useState<Integration | null>(null);
  const [databaseMetadata, setDatabaseMetadata] =
    useState<DatabaseMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if store is ready
  useEffect(() => {
    const checkStore = () => {
      if (window.electron?.store) {
        setIsStoreReady(true);
        console.log("store is ready");
      } else {
        setTimeout(checkStore, 100);
      }
    };
    checkStore();
  }, []);

  // Load stored data once store is ready
  useEffect(() => {
    if (!isStoreReady || isInitialized) return;

    const loadStoredData = async () => {
      try {
        console.log("Loading stored data...");
        const storedIntegrations =
          await window.electron.store.getIntegrations();
        const activeIntegrationId =
          await window.electron.store.getActiveIntegrationId();

        console.log("Stored integrations:", storedIntegrations);
        console.log("Active integration ID:", activeIntegrationId);

        // Only set integrations if we found some stored
        if (storedIntegrations?.length > 0) {
          setIntegrations(storedIntegrations);
        }

        // Only set active integration if we found a valid one
        if (activeIntegrationId && storedIntegrations?.length) {
          const active = storedIntegrations.find(
            (i) => i.id === activeIntegrationId,
          );
          if (active) {
            setActiveIntegration(active);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading stored data:", error);
        setIsInitialized(true);
      }
    };

    void loadStoredData();
  }, [isStoreReady, isInitialized]);

  // Only set default active integration if we've initialized and none is set
  useEffect(() => {
    if (isInitialized && !activeIntegration && integrations[0]) {
      setActiveIntegration(integrations[0]);
    }
  }, [integrations, activeIntegration, isInitialized]);

  // Persist integrations whenever they change
  useEffect(() => {
    if (!window.electron?.store || !isStoreReady || !isInitialized) return;
    console.log("setting integrations", integrations);
    void window.electron.store.setIntegrations(integrations);
  }, [integrations, isStoreReady, isInitialized]);

  // Persist active integration whenever it changes
  useEffect(() => {
    if (!window.electron?.store || !isStoreReady || !isInitialized) return;
    console.log("setting active integration", activeIntegration?.id);
    void window.electron.store.setActiveIntegrationId(
      activeIntegration?.id ?? null,
    );
  }, [activeIntegration?.id, isStoreReady, isInitialized]);

  const initializeDriver = async (integration: Integration) => {
    console.log("initializeDriver", integration);
    try {
      const result = await window.electron.database.connect(integration);
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
      setDatabaseMetadata(null);
      console.log("Fetching metadata for", connectionId);
      // I'm validating here because unsafe casting occurs deep in this funciton
      // Imo we should push this validation deeper into electron itself
      const metadata = await window.electron.database.getMetadata(connectionId);
      const validatedMetadata = databaseMetadataSchema.parse(metadata);
      setDatabaseMetadata(validatedMetadata);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const editIntegration = (
    id: string,
    updates: Omit<Integration, "id" | "createdAt">,
  ) => {
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
    setIntegrations((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      if (activeIntegration?.id === id) {
        // If removed integration was active, set new active integration
        setActiveIntegration(filtered[0] ?? null);
      }
      return filtered;
    });
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
        databaseMetadata,
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
