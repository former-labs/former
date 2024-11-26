import { type ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid
import { AgGridReact } from "ag-grid-react"; // React Data Grid Component
import { useMemo } from "react";

export const TableDataView = ({
  data,
  className,
}: {
  data: Record<string, string | number>[];
  className?: string;
}) => {
  const columnDefs = useMemo<ColDef[]>(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]!).map((key) => ({
      field: key,
      // filter: true,
    }));
  }, [data]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      // filter: true,
      // editable: true,
    };
  }, []);

  return (
    <div className={`ag-theme-quartz w-full ${className ?? ""}`}>
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
        onSelectionChanged={(event) => console.log("Row Selected!")}
        onCellValueChanged={(event) =>
          console.log(`New Cell Value: ${event.value}`)
        }
      />
    </div>
  );
};
