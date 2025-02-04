"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { Integration } from "@/types/connections";
import { createContext, useContext, useEffect, useState } from "react";
import { useDatabaseMetadata } from "./databaseMetadataStore";

interface DataContextType {
  activeIntegration: Integration | null;
  setActiveIntegration: (integration: Integration | null) => void;
  integrations: Integration[];
  addIntegration: ({
    integration,
  }: {
    integration: Omit<Integration, "id" | "createdAt">;
  }) => void;
  editIntegration: ({
    id,
    updates,
  }: {
    id: string;
    updates: Omit<Integration, "id" | "createdAt">;
  }) => void;
  removeIntegration: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeIntegration, setActiveIntegration] =
    useState<Integration | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { fetchMetadataIncremental } = useDatabaseMetadata();
  const electronStore = useElectronStore();
  const { activeRole } = useAuth();

  const workspaceId = activeRole?.workspace.id;

  // Load stored data once store is ready
  useEffect(() => {
    if (!electronStore || isInitialized || !workspaceId) return;

    const loadStoredData = async () => {
      try {
        const storedIntegrations = await electronStore.getIntegrations();
        const activeIntegrationId =
          await electronStore.getActiveIntegrationId();

        // Filter integrations by workspace and only set if we found some stored
        // const workspaceIntegrations = storedIntegrations;
        const workspaceIntegrations = storedIntegrations?.filter(
          (integration) => integration.workspaceId === workspaceId,
        );

        if (workspaceIntegrations?.length > 0) {
          setIntegrations(workspaceIntegrations);
        }

        // Only set active integration if we found a valid one for this workspace
        if (activeIntegrationId && workspaceIntegrations?.length) {
          const active = workspaceIntegrations.find(
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
  }, [electronStore, isInitialized, workspaceId]);

  // Only set default active integration if we've initialized and none is set
  useEffect(() => {
    if (isInitialized && !activeIntegration && integrations[0]) {
      setActiveIntegration(integrations[0]);
    }
  }, [integrations, activeIntegration, isInitialized]);

  // Persist integrations whenever they change
  useEffect(() => {
    if (!electronStore || !isInitialized) return;
    void electronStore.setIntegrations(integrations);
  }, [integrations, electronStore, isInitialized]);

  // Persist active integration whenever it changes
  useEffect(() => {
    if (!electronStore || !isInitialized) return;
    void electronStore.setActiveIntegrationId(activeIntegration?.id ?? null);
  }, [activeIntegration?.id, electronStore, isInitialized]);

  const initializeDriver = async (integration: Integration) => {
    try {
      const result = await window.electron.database.connect(integration);

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

  // Initialize connection when integration changes
  useEffect(() => {
    if (activeIntegration) {
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

  const addIntegration = ({
    integration,
  }: {
    integration: Omit<Integration, "id" | "createdAt">;
  }) => {
    const newIntegration: Integration = {
      ...integration,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setIntegrations((prev) => [...prev, newIntegration]);
    setActiveIntegration(newIntegration);
  };

  const editIntegration = ({
    id,
    updates,
  }: {
    id: string;
    updates: Omit<Integration, "id" | "createdAt">;
  }) => {
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

  return (
    <DataContext.Provider
      value={{
        activeIntegration,
        setActiveIntegration,
        integrations,
        addIntegration,
        editIntegration,
        removeIntegration,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useIntegrations = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

const useElectronStore = () => {
  const [store, setStore] = useState<typeof window.electron.store | null>(null);

  useEffect(() => {
    const checkStore = () => {
      if (window.electron?.store) {
        setStore(window.electron.store);
      } else {
        setTimeout(checkStore, 100);
      }
    };
    checkStore();
  }, []);

  return store;
};
