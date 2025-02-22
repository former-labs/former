import { useQueryExecution } from "@/app/(main)/editor/_components/resultPane/useQueryExecution";
import { z } from "zod";
import { create } from "zustand";

const resultRowSchema = z.array(z.record(z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.date(),
  z.null(),
  z.array(z.number()),
  z.record(z.unknown()), // Add JSON support
])));
export type ResultRow = z.infer<typeof resultRowSchema>[number];

interface QueryResultStore {
  result: ResultRow[] | null;
  resultLoading: boolean;
  resultError: string | null;
  queryStartTime: Date | null;
  currentJobId: string | null;
  setResult: (result: ResultRow[] | null) => void;
  setResultLoading: (resultLoading: boolean) => void;
  setResultError: (resultError: string | null) => void;
  setQueryStartTime: (time: Date | null) => void;
  setCurrentJobId: (jobId: string | null) => void;
}

const useQueryResultStore = create<QueryResultStore>((set) => ({
  result: null,
  resultLoading: false,
  resultError: null,
  queryStartTime: null,
  currentJobId: null,
  setResult: (result) => set({ result }),
  setResultLoading: (resultLoading) => set({ resultLoading }),
  setResultError: (resultError) => set({ resultError }),
  setQueryStartTime: (time) => set({ queryStartTime: time }),
  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),
}));

export const useQueryResult = () => {
  const store = useQueryResultStore();
  const { executeQuery, cancelQuery, getQueryResult } = useQueryExecution();

  const handleExecuteQuery = async ({
    editorSelectionContent,
    editorContent,
  }: {
    editorSelectionContent: string | null;
    editorContent: string;
  }) => {
    store.setResult(null);
    store.setResultLoading(true);
    store.setResultError(null);
    store.setQueryStartTime(new Date());
    
    // Use pending content if available, otherwise use current content
    const query = editorSelectionContent ?? editorContent;
    console.log("Executing query", [query]);
    
    const { jobId } = await executeQuery(query);
    console.log("jobId", jobId);
    store.setCurrentJobId(jobId);

    const result = await getQueryResult(jobId);

    if (result.status === "error") {
      console.log("Failed to execute query:", result.error);
      store.setResultError(result.error);
      store.setResult(null);
    } else if (result.status === "complete") {
      const validatedResult = resultRowSchema.parse(result.result);
      store.setResult(validatedResult);
      console.log("Execute result", validatedResult);
    } else if (result.status === "canceled") {
      console.log("Query canceled");
      store.setResult(null);
    }

    store.setResultLoading(false);
    store.setQueryStartTime(null);
    store.setCurrentJobId(null);
  };

  const handleCancelQuery = async () => {
    if (store.currentJobId) {
      await cancelQuery(store.currentJobId);
      store.setCurrentJobId(null);
      store.setResultLoading(false);
      store.setQueryStartTime(null);
      store.setResult(null);
    }
  };

  return {
    result: store.result,
    resultLoading: store.resultLoading,
    resultError: store.resultError,
    queryStartTime: store.queryStartTime,
    executeQuery: handleExecuteQuery,
    cancelQuery: store.resultLoading ? handleCancelQuery : null,
  };
};
