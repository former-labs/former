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
  }) => Promise<Integration>;
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
  const { fetchMetadataIncremental } = useDatabaseMetadata();
  const { activeRole } = useAuth();
  const {
    integrations,
    addIntegration,
    editIntegration,
    removeIntegration,
    isInitialized,
  } = useElectronIntegrations();

  console.log("ALL INTEGRATIONS", integrations);

  const workspaceId = activeRole?.workspace.id;

  const filteredIntegrations = integrations.filter(
    (integration) => integration.workspaceId === workspaceId,
  );

  // Clear active integration if workspace changes and integration doesn't belong to new workspace
  useEffect(() => {
    if (
      activeIntegration &&
      workspaceId &&
      activeIntegration.workspaceId !== workspaceId
    ) {
      setActiveIntegration(null);
    }
  }, [workspaceId, activeIntegration]);

  // Only set default active integration if we've initialized and none is set
  useEffect(() => {
    if (isInitialized && !activeIntegration && filteredIntegrations[0]) {
      setActiveIntegration(filteredIntegrations[0]);
    }
  }, [filteredIntegrations, activeIntegration, isInitialized]);

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

  return (
    <DataContext.Provider
      value={{
        activeIntegration,
        setActiveIntegration,
        integrations: filteredIntegrations,
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

const useElectronIntegrations = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const electronStore = useElectronStore();

  // Load stored data once store is ready
  useEffect(() => {
    if (!electronStore || isInitialized) return;

    const loadStoredData = async () => {
      try {
        const storedIntegrations = await electronStore.getIntegrations();

        if (storedIntegrations?.length > 0) {
          setIntegrations(storedIntegrations);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading stored data:", error);
        setIsInitialized(true);
      }
    };

    void loadStoredData();
  }, [electronStore, isInitialized]);

  const addIntegration = async ({
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

    if (electronStore) {
      void electronStore.setIntegrations([...integrations, newIntegration]);
    }

    return newIntegration;
  };

  const editIntegration = ({
    id,
    updates,
  }: {
    id: string;
    updates: Omit<Integration, "id" | "createdAt">;
  }) => {
    const updatedIntegrations = integrations.map((integration) =>
      integration.id === id
        ? {
            ...integration,
            type: updates.type,
            name: updates.name,
            credentials: updates.credentials,
          }
        : integration,
    );

    setIntegrations(updatedIntegrations);

    if (electronStore) {
      void electronStore.setIntegrations(updatedIntegrations);
    }
  };

  const removeIntegration = (id: string) => {
    const filteredIntegrations = integrations.filter((i) => i.id !== id);
    setIntegrations(filteredIntegrations);

    if (electronStore) {
      void electronStore.setIntegrations(filteredIntegrations);
    }
  };

  return {
    integrations,
    addIntegration,
    editIntegration,
    removeIntegration,
    isInitialized,
  };
};
