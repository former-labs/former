"use client";

import { type Driver } from "@/electron/drivers/driver";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import {
  IntegrationCombined,
  LocalIntegrationToSave,
  type DatabaseMetadata,
  type LocalIntegrationData,
} from "@/types/connections";
import { createContext, useContext, useEffect, useState } from "react";

interface DataContextType {
  activeCloudIntegration: IntegrationCombined | null;
  setActiveCloudIntegration: (integration: IntegrationCombined | null) => void;
  cloudIntegrations: IntegrationCombined[];
  databaseMetadata: DatabaseMetadata | null;
  isFetchingMetadata: boolean;
  driver: Driver | null;
  initializeDriver: (
    combinedIntegration: IntegrationCombined,
  ) => Promise<string | undefined>;
  fetchMetadataIncremental: (connectionId: string) => Promise<void>;
  fetchTablesForDataset: (
    integrationId: string,
    datasetId: string,
  ) => Promise<void>;
  loadingDatasets: Set<string>;
  isLoadingDatasets: boolean;
  localIntegrations: LocalIntegrationData[];
  addLocalIntegration: (integration: LocalIntegrationToSave) => void;
  editLocalIntegration: (id: string, updates: LocalIntegrationToSave) => void;
  removeLocalIntegration: (id: string) => void;
  executeQuery: (query: string) => Promise<{
    jobId: string;
  }>;
  cancelQuery: (jobId: string) => Promise<void>;
  getQueryResult: (jobId: string) => Promise<
    | {
        status: "complete";
        result: any[];
      }
    | {
        status: "error";
        error: string;
      }
    | {
        status: "canceled";
      }
  >;
  loadedDatasets: Set<string>;
  setTableIncludedInAIContext: (params: {
    projectId: string;
    datasetId: string;
    tableId: string;
    value: boolean;
  }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  // Active cloud integration is what we use to keep track of the active integration, when we want to do anything with the
  // local integration, we use the id of the activeCloudIntegration to get the local integration from the localIntegrations array
  const [activeCloudIntegration, setActiveCloudIntegration] =
    useState<IntegrationCombined | null>(null);
  const [cloudIntegrations, setCloudIntegrations] = useState<
    IntegrationCombined[]
  >([]);
  const [databaseMetadata, setDatabaseMetadata] =
    useState<DatabaseMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [localIntegrations, setLocalIntegrations] = useState<
    LocalIntegrationData[]
  >([]);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadedDatasets, setLoadedDatasets] = useState<Set<string>>(new Set());

  const createIntegration = api.integration.createIntegration.useMutation();
  const deleteIntegration = api.integration.deleteIntegration.useMutation();
  const updateIntegration = api.integration.updateIntegration.useMutation();

  const { data: fetchedIntegrations } =
    api.integration.getIntegrations.useQuery();

  useEffect(() => {
    if (fetchedIntegrations) {
      const combinedIntegrations = fetchedIntegrations.map((integration) => ({
        ...integration,
        localIntegrationData:
          localIntegrations.find((local) => local.id === integration.id) ??
          null,
      }));

      setCloudIntegrations(combinedIntegrations);
    }
  }, [fetchedIntegrations, localIntegrations]);

  // Check if store is ready
  useEffect(() => {
    const checkStore = () => {
      if (window.electron?.store) {
        setIsStoreReady(true);
      } else {
        setTimeout(checkStore, 100);
      }
    };
    checkStore();
  }, []);

  // Load stored data once store is ready and activeCloudIntegration is set
  useEffect(() => {
    if ((!isStoreReady || isInitialized) && activeCloudIntegration) return;

    const loadStoredData = async () => {
      try {
        console.log("Loading stored data...");
        const currentLocalIntegrations =
          await window.electron.store.getLocalIntegrations();

        console.log("Stored integrations:", currentLocalIntegrations);

        // Only set integrations if we found some stored
        if (currentLocalIntegrations?.length > 0) {
          setLocalIntegrations(currentLocalIntegrations);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Error loading stored data:", error);
        setIsInitialized(true);
      }
    };

    void loadStoredData();
  }, [isStoreReady, isInitialized, activeCloudIntegration]);

  // Persist integrations whenever they change
  useEffect(() => {
    if (!window.electron?.store || !isStoreReady || !isInitialized) return;
    console.log("setting integrations", localIntegrations);
    void window.electron.store.setLocalIntegrations(localIntegrations);
  }, [localIntegrations, isStoreReady, isInitialized]);

  const initializeDriver = async () => {
    if (!activeCloudIntegration) return;
    try {
      const result = await window.electron.database.connect(
        activeCloudIntegration,
      );
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
    if (!connectionId || isFetchingMetadata) return;

    try {
      setIsFetchingMetadata(true);
      setIsLoadingDatasets(true);
      setDatabaseMetadata(null);

      // First fetch projects and datasets
      const metadata =
        await window.electron.database.getProjectsAndDatasets(connectionId);
      setDatabaseMetadata(metadata);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      throw error;
    } finally {
      setIsFetchingMetadata(false);
      setIsLoadingDatasets(false);
    }
  };

  const fetchTablesForDataset = async (
    integrationId: string,
    datasetId: string,
  ) => {
    // Skip if already loaded or currently loading
    if (
      !integrationId ||
      !datasetId ||
      loadedDatasets.has(datasetId) ||
      loadingDatasets.has(datasetId)
    )
      return;

    try {
      setLoadingDatasets((prev) => new Set([...prev, datasetId]));

      // Check if we already have tables for this dataset
      const existingTables = databaseMetadata?.projects
        .flatMap((p) => p.datasets)
        .find((d) => d.id === datasetId)?.tables;

      if (existingTables && existingTables.length > 0) {
        setLoadedDatasets((prev) => new Set([...prev, datasetId]));
        return;
      }

      const { tables, nextPageToken } =
        await window.electron.database.getTablesForDataset(
          integrationId,
          datasetId,
        );

      setDatabaseMetadata((prev) => {
        if (!prev) return prev;
        return {
          dialect: prev.dialect,
          projects: prev.projects.map((project) => ({
            ...project,
            datasets: project.datasets.map((dataset) => {
              if (dataset.id === datasetId) {
                return {
                  ...dataset,
                  tables: tables,
                };
              }
              return dataset;
            }),
          })),
        };
      });

      // Mark dataset as loaded only if we've loaded all pages
      if (!nextPageToken) {
        setLoadedDatasets((prev) => new Set([...prev, datasetId]));
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      throw error;
    } finally {
      setLoadingDatasets((prev) => {
        const next = new Set(prev);
        next.delete(datasetId);
        return next;
      });
    }
  };

  // Initialize connection when integration changes
  useEffect(() => {
    initializeDriver()
      .then((connectionId) => {
        if (connectionId) {
          void fetchMetadataIncremental(connectionId);
        }
      })
      .catch(console.error);

    return () => {
      // Cleanup connection on unmount or integration change
      if (activeCloudIntegration?.id) {
        void window.electron.database.disconnect(activeCloudIntegration.id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCloudIntegration?.id]);

  const addLocalIntegration = async (
    localIntegrationToSave: LocalIntegrationToSave,
  ) => {
    const newIntegrationResult = await createIntegration.mutateAsync({
      name: localIntegrationToSave.name,
      type: "local",
      databaseType: localIntegrationToSave.databaseType,
      ...(localIntegrationToSave.demo && { demo: localIntegrationToSave.demo }),
    });

    const combinedIntegration: IntegrationCombined = {
      ...newIntegrationResult,
      localIntegrationData: {
        id: newIntegrationResult.id,
        config: localIntegrationToSave.config,
        credentials: localIntegrationToSave.credentials,
      },
    };

    setActiveCloudIntegration(combinedIntegration);
  };

  const editLocalIntegration = async (
    id: string,
    updates: LocalIntegrationToSave,
  ) => {
    try {
      // Update cloud data first
      await updateIntegration.mutateAsync({
        id,
        name: updates.name,
      });

      // Then update local storage
      setLocalIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === id
            ? {
                id: integration.id,
                credentials: updates.credentials,
                config: updates.config,
              }
            : integration,
        ),
      );

      // Update active integration if this was the active one
      if (activeCloudIntegration?.id === id) {
        setActiveCloudIntegration((prev) =>
          prev ? { ...prev, name: updates.name } : prev,
        );
      }
    } catch (error) {
      console.error("Failed to update integration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update integration",
      });
    }
  };

  const removeLocalIntegration = async (id: string) => {
    try {
      // Delete from database first
      await deleteIntegration.mutateAsync({ id });

      // Then remove from local storage
      setLocalIntegrations((prev) => {
        const filtered = prev.filter((i) => i.id !== id);
        if (activeCloudIntegration?.id === id) {
          // If removed integration was active, clear it
          setActiveCloudIntegration(null);
        }
        return filtered;
      });
    } catch (error) {
      console.error("Failed to remove integration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove integration",
      });
    }
  };

  const executeQuery = async (query: string) => {
    if (!activeCloudIntegration?.id) {
      throw new Error("No active integration");
    }

    try {
      const result = await window.electron.database.execute(
        activeCloudIntegration.id,
        query,
      );
      return result;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  };

  const cancelQuery = async (jobId: string) => {
    if (!activeCloudIntegration?.id) {
      throw new Error("No active integration");
    }

    await window.electron.database.cancelJob(activeCloudIntegration.id, jobId);
  };

  const getQueryResult = async (jobId: string) => {
    if (!activeCloudIntegration?.id) {
      throw new Error("No active integration");
    }

    console.log("database", window.electron.database);
    const result = await window.electron.database.getJobResult(
      activeCloudIntegration.id,
      jobId,
    );
    return result;
  };

  const setTableIncludedInAIContext = ({
    projectId,
    datasetId,
    tableId,
    value,
  }: {
    projectId: string;
    datasetId: string;
    tableId: string;
    value: boolean;
  }) => {
    setDatabaseMetadata((prev) => {
      if (!prev) return prev;
      return {
        dialect: prev.dialect,
        projects: prev.projects.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            datasets: project.datasets.map((dataset) => {
              if (dataset.id !== datasetId) return dataset;
              return {
                ...dataset,
                tables: dataset.tables.map((table) => {
                  if (table.id !== tableId) return table;
                  return {
                    ...table,
                    includedInAIContext: value,
                  };
                }),
              };
            }),
          };
        }),
      };
    });
  };

  const getActiveIntegrationCombined = () => {
    if (!localIntegrations || !activeCloudIntegration) {
      return null;
    }

    const localIntegration = localIntegrations.find(
      (integration) => integration.id === activeCloudIntegration.id,
    );

    if (!localIntegration) {
      return null;
    }

    const combined: IntegrationCombined = {
      ...localIntegration,
      ...activeCloudIntegration,
    };

    return combined;
  };

  const getLocalIntegration = (id: string) => {
    return localIntegrations.find((integration) => integration.id === id);
  };

  return (
    <DataContext.Provider
      value={{
        activeCloudIntegration,
        setActiveCloudIntegration,
        cloudIntegrations,
        localIntegrations,
        databaseMetadata,
        isFetchingMetadata,
        driver: null,
        initializeDriver,
        fetchMetadataIncremental,
        fetchTablesForDataset,
        loadingDatasets,
        isLoadingDatasets,
        loadedDatasets,
        addLocalIntegration,
        editLocalIntegration,
        removeLocalIntegration,
        executeQuery,
        cancelQuery,
        getQueryResult,
        setTableIncludedInAIContext,
        getLocalIntegration,
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
