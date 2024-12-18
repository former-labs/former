import { useData } from "@/contexts/DataContext";
import { create } from "zustand";
import { useEditor } from "./editorStore";

interface QueryResultStore {
  result: unknown[] | null;
  resultLoading: boolean;
  resultError: string | null;
  setResult: (result: unknown[] | null) => void;
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
      const result = await executeQuery(query);
      console.log("result", result);
      store.setResult(result);
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
    executeQuery : handleExecuteQuery,
  };
};
