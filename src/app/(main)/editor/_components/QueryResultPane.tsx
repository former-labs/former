"use client";

import {
  type ColDef,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { type ResultRow, useQueryResult } from "./queryResultStore";

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
    <div className="h-full bg-gray-50 p-0">
      <TableDataView data={result} />
    </div>
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
        // Handle rendering of custom types
        if (params.value === null) {
          return <span className="text-gray-500">&lt;null&gt;</span>;
        }
        if (Array.isArray(params.value)) {
          return (
            <span>
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
          return <span>{JSON.stringify(params.value)}</span>;
        }
        return params.value;
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
