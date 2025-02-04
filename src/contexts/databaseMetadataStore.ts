import { env } from "@/env";
import { api } from "@/trpc/react";
import type { DatabaseMetadata } from "@/types/connections";
import { create } from "zustand";
import { useAuth } from "./AuthContext";

interface DatabaseMetadataStore {
  databaseMetadata: DatabaseMetadata | null;
  isFetchingMetadata: boolean;
  isLoadingDatasets: boolean;
  loadingDatasets: Set<string>;
  loadedDatasets: Set<string>;
  setDatabaseMetadata: (metadata: DatabaseMetadata | null) => void;
  setIsFetchingMetadata: (isFetching: boolean) => void;
  setIsLoadingDatasets: (isLoading: boolean) => void;
  setLoadingDatasets: (datasets: Set<string>) => void;
  setLoadedDatasets: (datasets: Set<string>) => void;
  setTableIncludedInAIContext: (params: {
    projectId: string;
    datasetId: string;
    tableId: string;
    value: boolean;
  }) => void;
  fetchMetadataIncremental: (connectionId: string) => Promise<void>;
  fetchTablesForDataset: (
    connectionId: string,
    datasetId: string,
  ) => Promise<void>;
}

const useDatabaseMetadataStore = create<DatabaseMetadataStore>((set, get) => ({
  databaseMetadata: null,
  isFetchingMetadata: false,
  isLoadingDatasets: false,
  loadingDatasets: new Set(),
  loadedDatasets: new Set(),

  setDatabaseMetadata: (metadata) => set({ databaseMetadata: metadata }),
  setIsFetchingMetadata: (isFetching) => set({ isFetchingMetadata: isFetching }),
  setIsLoadingDatasets: (isLoading) => set({ isLoadingDatasets: isLoading }),
  setLoadingDatasets: (datasets) => set({ loadingDatasets: datasets }),
  setLoadedDatasets: (datasets) => set({ loadedDatasets: datasets }),

  setTableIncludedInAIContext: ({ projectId, datasetId, tableId, value }) => {
    set((state) => {
      if (!state.databaseMetadata) return state;
      return {
        databaseMetadata: {
          dialect: state.databaseMetadata.dialect,
          projects: state.databaseMetadata.projects.map((project) => {
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
        },
      };
    });
  },

  fetchMetadataIncremental: async (connectionId: string) => {
    const state = get();
    if (!connectionId || state.isFetchingMetadata) return;

    try {
      set({ isFetchingMetadata: true, isLoadingDatasets: true, databaseMetadata: null });

      // First fetch projects and datasets
      const metadata = await window.electron.database.getProjectsAndDatasets(connectionId);
      set({ databaseMetadata: metadata });
    } catch (error) {
      console.error("Error fetching metadata:", error);
      throw error;
    } finally {
      set({ isFetchingMetadata: false, isLoadingDatasets: false });
    }
  },

  fetchTablesForDataset: async (connectionId: string, datasetId: string) => {
    const state = get();
    // Skip if already loaded or currently loading
    if (
      !connectionId ||
      !datasetId ||
      state.loadedDatasets.has(datasetId) ||
      state.loadingDatasets.has(datasetId)
    )
      return;

    try {
      set((prev) => ({
        loadingDatasets: new Set([...prev.loadingDatasets, datasetId]),
      }));

      // Check if we already have tables for this dataset
      const existingTables = state.databaseMetadata?.projects
        .flatMap((p) => p.datasets)
        .find((d) => d.id === datasetId)?.tables;

      if (existingTables && existingTables.length > 0) {
        set((prev) => ({
          loadedDatasets: new Set([...prev.loadedDatasets, datasetId]),
        }));
        return;
      }

      const { tables, nextPageToken } =
        await window.electron.database.getTablesForDataset(connectionId, datasetId);

      set((prev) => {
        if (!prev.databaseMetadata) return prev;
        return {
          databaseMetadata: {
            dialect: prev.databaseMetadata.dialect,
            projects: prev.databaseMetadata.projects.map((project) => ({
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
          },
        };
      });

      // Mark dataset as loaded only if we've loaded all pages
      if (!nextPageToken) {
        set((prev) => ({
          loadedDatasets: new Set([...prev.loadedDatasets, datasetId]),
        }));
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
      throw error;
    } finally {
      set((prev) => {
        const next = new Set(prev.loadingDatasets);
        next.delete(datasetId);
        return { loadingDatasets: next };
      });
    }
  },
}));

const useDatabaseMetadataWeb = () => {
  const utils = api.useUtils();
  const { authUser, activeRole } = useAuth();
  const { data: databaseMetadata, isLoading } =
    api.databaseMetadata.getDatabaseMetadata.useQuery(undefined, {
      enabled: !!authUser && !!activeRole?.workspace.id,
    });

  const { mutate: setDatabaseMetadataMutation } =
    api.databaseMetadata.setDatabaseMetadata.useMutation({
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
    void utils.databaseMetadata.getDatabaseMetadata.cancel();
    utils.databaseMetadata.getDatabaseMetadata.setData(
      undefined,
      updatedMetadata,
    );

    setDatabaseMetadataMutation({
      databaseMetadata: updatedMetadata,
    });
  };

  // Stub functions for web version
  const fetchMetadataIncremental = async () => {
    // No-op for web version
  };

  const fetchTablesForDataset = async () => {
    // No-op for web version  
  };

  return {
    databaseMetadata: databaseMetadata ?? null,
    isFetchingMetadata: isLoading,
    isLoadingDatasets: false,
    loadingDatasets: new Set<string>(),
    loadedDatasets: new Set<string>(),
    setTableIncludedInAIContext,
    fetchMetadataIncremental,
    fetchTablesForDataset,
  };
};

export const useDatabaseMetadata = () => {
  const store = useDatabaseMetadataStore();
  const web = useDatabaseMetadataWeb();

  if (env.NEXT_PUBLIC_PLATFORM === "desktop") {
    return {
      databaseMetadata: store.databaseMetadata,
      isFetchingMetadata: store.isFetchingMetadata,
      isLoadingDatasets: store.isLoadingDatasets,
      loadingDatasets: store.loadingDatasets,
      loadedDatasets: store.loadedDatasets,
      setTableIncludedInAIContext: store.setTableIncludedInAIContext,
      fetchMetadataIncremental: store.fetchMetadataIncremental,
      fetchTablesForDataset: store.fetchTablesForDataset,
    };
  } else {
    return web;
  }
};
