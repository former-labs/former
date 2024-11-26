import { type RouterOutputs } from "@/trpc/react";

type GoogleAnalyticsReportResultDataType =
  RouterOutputs["googleAnalytics"]["executeGoogleAnalyticsReport"]["data"];

export const exportGoogleAnalyticsToCsv = (
  data: GoogleAnalyticsReportResultDataType | null,
) => {
  if (!data?.rows?.length) return;

  // Get headers from columns
  const headers = data.columns.map(column => column.name);
  
  // Convert data to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.rows.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that need quotes (strings with commas, etc)
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"`
          : value;
      }).join(',')
    )
  ];

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'verve_ga4_export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
