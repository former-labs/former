"use client";

import { useQueryResult } from "./queryResultStore";

export const QueryResultPane = () => {
  const { result, resultLoading, resultError } = useQueryResult();

  if (resultLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading query results...</div>
      </div>
    );
  }

  if (resultError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-red-500">{resultError}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">
          No results yet. Execute a query to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-4">
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};
