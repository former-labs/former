"use client";

import { Button } from "@/components/ui/button";
import {
  type ColDef,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useState } from "react";
import { QueryResultError } from "./QueryResultError";
import { QueryResultHeader } from "./QueryResultHeader";
import { type ResultRow, useQueryResult } from "./queryResultStore";

export const QueryResultPane = () => {
  const { result, resultLoading, resultError, queryStartTime, cancelQuery } =
    useQueryResult();

  if (resultLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-gray-500">Loading query results...</div>
        {queryStartTime && <QueryTimer startTime={queryStartTime} />}
        {cancelQuery && (
          <Button
            onClick={() => cancelQuery()}
            className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Cancel Query
          </Button>
        )}
      </div>
    );
  }

  if (resultError) {
    return <QueryResultError resultError={resultError} />;
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
    <div className="flex h-full flex-col bg-gray-100 p-0">
      <QueryResultHeader data={result} />
      <div className="flex-grow">
        <TableDataView data={result} />
      </div>
    </div>
  );
};

const QueryTimer = ({ startTime }: { startTime: Date }) => {
  const [elapsedTime, setElapsedTime] = useState("0s");

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(`${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="mt-2 text-sm text-gray-500">Running for {elapsedTime}</div>
  );
};

ModuleRegistry.registerModules([AllCommunityModule]);

const TableDataView = ({ data }: { data: ResultRow[] }) => {
  const columnDefs = useMemo<ColDef[]>(() => {
    if (!data?.[0]) return [];
    return Object.keys(data[0]).map((key) => ({
      field: key,
      // filter: true,
      cellRenderer: (params: { value: ResultRow[keyof ResultRow] }) => {
        // Add ph-no-capture class to mask the content
        const noCapture = "ph-no-capture";

        // Handle rendering of custom types
        if (params.value === null) {
          return (
            <span className={`text-gray-500 ${noCapture}`}>&lt;null&gt;</span>
          );
        }
        if (Array.isArray(params.value)) {
          return (
            <span className={noCapture}>
              {"{"}
              {params.value
                .map((val: unknown) => {
                  if (typeof val !== "number") {
                    throw new Error("Array contains non-number value");
                  }
                  return val.toString();
                })
                .join(",")}
              {"}"}
            </span>
          );
        }
        if (typeof params.value === "object" && params.value !== null) {
          return (
            <span className={noCapture}>{JSON.stringify(params.value)}</span>
          );
        }
        return <span className={noCapture}>{params.value}</span>;
      },
    }));
  }, [data]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      // filter: true,
      // editable: true,
    };
  }, []);

  return (
    <div className="ag-theme-quartz h-full w-full">
      <AgGridReact
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        suppressClickEdit={true}
        pagination={true}
        rowSelection="multiple"
        domLayout="normal"
        ensureDomOrder={true}
        suppressColumnVirtualisation={true}
        onGridReady={(params) => {
          params.api.sizeColumnsToFit();
          window.addEventListener("resize", () => {
            params.api.sizeColumnsToFit();
          });
        }}
        onSelectionChanged={(event) => console.log("Row Selected!", event)}
        onCellValueChanged={(event) =>
          console.log(`New Cell Value: ${event.value}`)
        }
      />
    </div>
  );
};
