"use client";

import { useIntegrations } from "@/contexts/DataContext";

export const useQueryExecution = () => {
  const { activeIntegration } = useIntegrations();

  if (!activeIntegration) {
    throw new Error("No active integration");
  }

  return {
    executeQuery: async (query: string) => {
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
    },

    cancelQuery: async (jobId: string) => {
      await window.electron.database.cancelJob(activeIntegration.id, jobId);
    },

    getQueryResult: async (jobId: string) => {
      console.log("database", window.electron.database);
      const result = await window.electron.database.getJobResult(
        activeIntegration.id,
        jobId,
      );
      return result;
    },
  };
};
