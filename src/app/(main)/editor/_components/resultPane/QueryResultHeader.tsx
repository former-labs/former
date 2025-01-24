import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { type ResultRow } from "./queryResultStore";

const exportAsCsv = (data: ResultRow[]) => {
  // Get headers from first row
  if (!data?.[0]) {
    throw new Error("No data to export");
  }
  const headers = Object.keys(data[0]);

  // Convert data to CSV rows
  const csvRows = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) => {
      return headers
        .map((header) => {
          const value = row[header];
          if (value === null) return "";
          if (Array.isArray(value)) return `"{${value.join(",")}}"`;
          if (typeof value === "object") return `"${JSON.stringify(value)}"`;
          if (typeof value === "string" && value.includes(","))
            return `"${value}"`;
          return value;
        })
        .join(",");
    }),
  ];

  // Create blob and download
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "query_result.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const QueryResultHeader = ({ data }: { data: ResultRow[] }) => {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <h2 className="text-sm font-medium text-gray-700">Result</h2>
      <Button
        variant="outline"
        size="icon"
        onClick={() => exportAsCsv(data)}
        tooltipText="Download as CSV"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
