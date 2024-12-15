type TableData = {
  rows: Record<string, unknown>[];
};

export function exportToCsv(data: TableData, filename = "export.csv") {
  if (!data.rows || data.rows.length === 0) {
    console.warn("No data to export");
    return;
  }

  try {
    // Get headers from the first row
    const headers = Object.keys(data.rows[0]);

    // Create CSV content
    const csvContent = [
      // Headers row
      headers.join(","),
      // Data rows
      ...data.rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle different value types
            if (value === null || value === undefined) return "";
            if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
            return String(value);
          })
          .join(",")
      ),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to export CSV:", error);
  }
} 