import { useData } from "@/contexts/DataContext";
import { z } from "zod";
import { create } from "zustand";
import { useEditor } from "./editorStore";

const resultRowSchema = z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.date()])));
export type ResultRow = z.infer<typeof resultRowSchema>[number];

interface QueryResultStore {
  result: ResultRow[] | null;
  resultLoading: boolean;
  resultError: string | null;
  setResult: (result: ResultRow[] | null) => void;
  setResultLoading: (resultLoading: boolean) => void;
  setResultError: (resultError: string | null) => void;
}

const useQueryResultStore = create<QueryResultStore>((set) => ({
  result: null,
  resultLoading: false,
  resultError: null,
  setResult: (result) => set({ result }),
  setResultLoading: (resultLoading) => set({ resultLoading }),
  setResultError: (resultError) => set({ resultError }),
}));

export const useQueryResult = () => {
  const store = useQueryResultStore();
  const { executeQuery } = useData();
  const { editorSelectionContent, editorContent } = useEditor();

  const handleExecuteQuery = async () => {
    store.setResultLoading(true);
    store.setResultError(null);
    
    try {
      // Use pending content if available, otherwise use current content
      const query = editorSelectionContent ?? editorContent;
      // console.log([editorSelectionContent, editorContent]);
      console.log("Executing query", [query]);
      const rawResult = await executeQuery(query);
      const validatedResult = resultRowSchema.parse(rawResult);
      store.setResult(validatedResult);
      console.log("Execute result", validatedResult);
    } catch (error) {
      console.error("Failed to execute query:", error);
      store.setResultError((error as Error).message);
      store.setResult(null);
    } finally {
      store.setResultLoading(false);
    }
  };

  return {
    result: store.result,
    resultLoading: store.resultLoading,
    resultError: store.resultError,
    executeQuery: handleExecuteQuery,
  };
};
