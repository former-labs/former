"use client";

import {
  type Driver,
  createDatabaseConnection as createDriver,
} from "@/electron/drivers/clients";
import type {
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
  initializeDatabaseConnection: (integration: Integration) => Promise<void>;
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
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [currentDatasetIndex, setCurrentDatasetIndex] = useState(0);
  const [datasetsPageToken, setDatasetsPageToken] = useState<
    string | undefined
  >();
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    if (!activeIntegration && integrations[0]) {
      setActiveIntegration(integrations[0]);
    }
  }, [integrations, activeIntegration]);

  const initializeDriver = async (integration: Integration) => {
    try {
      const driver = createDriver({
        credentials: integration.credentials,
        projectId: integration.id,
        type: integration.type,
      });
      await driver.connect();
      setDriver(driver);
    } catch (error) {
      console.error("Failed to initialize database connection:", error);
      throw error;
    }
  };

  const fetchMetadataIncremental = async () => {
    if (!driver || isFetchingMetadata) return;

    try {
      setIsFetchingMetadata(true);

      if (datasetsPageToken !== null) {
        // Still fetching datasets
        setIsLoadingDatasets(true);
        const datasetsResult = await driver.fetchDatasets(datasetsPageToken);

        setWarehouseMetadata((currentMetadata) => {
          const newMetadata: WarehouseMetadata = {
            projects: [
              {
                id: driver.getProjectId(),
                name: driver.getProjectName(),
                datasets: [
                  ...(currentMetadata?.projects?.[0]?.datasets ?? []),
                  ...datasetsResult.datasets.map((d) => ({ ...d, tables: [] })),
                ],
              },
            ],
          };
          return newMetadata;
        });

        setDatasetsPageToken(datasetsResult.nextPageToken ?? undefined);
        setCurrentDatasetIndex(0);
      } else if (warehouseMetadata?.projects?.[0]?.datasets) {
        // Fetching tables for datasets
        const datasets = warehouseMetadata.projects[0].datasets;

        if (currentDatasetIndex < datasets.length) {
          setIsLoadingTables(true);
          const dataset = datasets[currentDatasetIndex];
          const tablesResult = await driver.fetchTablesForDataset(
            dataset?.id ?? "",
          );

          setWarehouseMetadata((currentMetadata) => {
            const newMetadata = { ...currentMetadata! };
            if (newMetadata.projects?.[0]?.datasets?.[currentDatasetIndex]) {
              newMetadata.projects[0].datasets[currentDatasetIndex].tables =
                tablesResult.tables;
            }
            return newMetadata;
          });

          setCurrentDatasetIndex((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error fetching metadata incrementally:", error);
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
      driver?.disconnect().catch(console.error);
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
        driver,
        initializeDatabaseConnection: initializeDriver,
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
