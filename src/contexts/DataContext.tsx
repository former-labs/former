"use client";

import { type Driver } from "@/electron/drivers/driver";
import { api } from "@/trpc/react";
import {
  IntegrationToSave,
  type DatabaseMetadata,
  type LocalIntegrationData,
} from "@/types/connections";
import { createContext, useContext, useEffect, useState } from "react";

interface DataContextType {
  activeIntegration: LocalIntegrationData | null;
  setActiveIntegration: (integration: LocalIntegrationData | null) => void;
  databaseMetadata: DatabaseMetadata | null;
  isFetchingMetadata: boolean;
  driver: Driver | null;
  initializeDriver: (
    integration: LocalIntegrationData,
  ) => Promise<string | undefined>;
  fetchMetadataIncremental: (connectionId: string) => Promise<void>;
  fetchTablesForDataset: (
    connectionId: string,
    datasetId: string,
  ) => Promise<void>;
  loadingDatasets: Set<string>;
  isLoadingDatasets: boolean;
  localIntegrationDataList: LocalIntegrationData[];
  addLocalIntegration: (integration: IntegrationToSave) => Promise<void>;
  editLocalIntegration: (id: string, integration: IntegrationToSave) => void;
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
  const [activeIntegration, setActiveIntegration] =
    useState<LocalIntegrationData | null>(null);
  const [databaseMetadata, setDatabaseMetadata] =
    useState<DatabaseMetadata | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [localIntegrationDataList, setLocalIntegrationDataList] = useState<
    LocalIntegrationData[]
  >([]);
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadedDatasets, setLoadedDatasets] = useState<Set<string>>(new Set());

  const createIntegration = api.integration.createIntegration.useMutation();

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
          setLocalIntegrationDataList(storedIntegrations);
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
    if (isInitialized && !activeIntegration && localIntegrationDataList[0]) {
      setActiveIntegration(localIntegrationDataList[0]);
    }
  }, [localIntegrationDataList, activeIntegration, isInitialized]);

  // Persist integrations whenever they change
  useEffect(() => {
    if (!window.electron?.store || !isStoreReady || !isInitialized) return;
    console.log("setting integrations", localIntegrationDataList);
    void window.electron.store.setIntegrations(localIntegrationDataList);
  }, [localIntegrationDataList, isStoreReady, isInitialized]);

  // Persist active integration whenever it changes
  useEffect(() => {
    if (!window.electron?.store || !isStoreReady || !isInitialized) return;
    console.log("setting active integration", activeIntegration?.id);
    void window.electron.store.setActiveIntegrationId(
      activeIntegration?.id ?? null,
    );
  }, [activeIntegration?.id, isStoreReady, isInitialized]);

  const initializeDriver = async (integration: LocalIntegrationData) => {
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
    connectionId: string,
    datasetId: string,
  ) => {
    // Skip if already loaded or currently loading
    if (
      !connectionId ||
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
          connectionId,
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

  const addLocalIntegration = async (integrationToSave: IntegrationToSave) => {
    const newIntegration = await createIntegration.mutateAsync({
      name: integrationToSave.name,
      type: "local",
      databaseType: integrationToSave.databaseType,
    });
    const id = newIntegration.id;

    setLocalIntegrationDataList((prev) => [
      ...prev,
      {
        id: newIntegration.id,
        config: integrationToSave.config,
        credentials: integrationToSave.credentials,
      },
    ]);
    setActiveIntegration({
      id: newIntegration.id,
      config: integrationToSave.config,
      credentials: integrationToSave.credentials,
    });
  };

  const editLocalIntegration = (
    id: string,
    integrationToSave: IntegrationToSave,
  ) => {
    setLocalIntegrationDataList((prev) =>
      prev.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              databaseType: integrationToSave.databaseType,
              name: integrationToSave.name,
              credentials: integrationToSave.credentials,
            }
          : integration,
      ),
    );
  };

  const removeLocalIntegration = (id: string) => {
    setLocalIntegrationDataList((prev) => {
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

  const cancelQuery = async (jobId: string) => {
    if (!activeIntegration?.id) {
      throw new Error("No active integration");
    }

    await window.electron.database.cancelJob(activeIntegration.id, jobId);
  };

  const getQueryResult = async (jobId: string) => {
    if (!activeIntegration?.id) {
      throw new Error("No active integration");
    }

    console.log("database", window.electron.database);
    const result = await window.electron.database.getJobResult(
      activeIntegration.id,
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

  return (
    <DataContext.Provider
      value={{
        activeIntegration,
        setActiveIntegration,
        localIntegrationDataList,
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

  const utils = api.useUtils();
  const { data: databaseMetadata, isLoading } =
    api.integration.getIntegration.useQuery();

  const { mutate: setDatabaseMetadataMutation } =
    api.integration.setDatabaseMetadata.useMutation({
      onSuccess: () => {
        // void utils.databaseMetadata.getDatabaseMetadata.invalidate();
      },
    });

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
    if (!databaseMetadata) return;

    const updatedMetadata = {
      dialect: databaseMetadata.dialect,
      projects: databaseMetadata.projects.map((project) => {
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

    // Optimistically update the cache
    void utils.integration.getIntegration.cancel();
    utils.integration.getIntegration.setData(undefined, updatedMetadata);

    setDatabaseMetadataMutation({
      databaseMetadata: updatedMetadata,
    });
  };

  return {
    ...context,
    databaseMetadata,
    isFetchingMetadata: isLoading,
    setTableIncludedInAIContext,
  };
};
