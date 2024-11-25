"use client";

import { api } from "@/trpc/react";

export const MetadataDetails = ({ workspaceUid }: { workspaceUid: string }) => {
  const { data: metadata } = api.eval.getGoogleAnalyticsMetadata.useQuery({
    workspaceUid,
  });

  const groupByCategory = (items: any[] = []) => {
    return items.reduce((acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  let metadataDimensions = null;
  let metadataMetrics = null;
  if (metadata?.success) {
    metadataDimensions = metadata.data?.dimensions;
    metadataMetrics = metadata.data?.metrics;
  }

  return (
    <details className="mb-4 rounded-lg border bg-white p-4">
      <summary className="cursor-pointer font-medium">
        Google Analytics Metadata
      </summary>
      <div className="mt-2">
        {metadataDimensions && metadataMetrics && (
          <div className="space-y-4">
            <details className="rounded bg-gray-50 p-4">
              <summary className="cursor-pointer font-medium">
                Dimensions
              </summary>
              <div className="mt-2 space-y-2">
                {Object.entries(groupByCategory(metadataDimensions)).map(
                  ([category, items]) => (
                    <details key={category} className="rounded bg-gray-100 p-4">
                      <summary className="cursor-pointer font-medium">
                        {category}
                      </summary>
                      <pre className="mt-2 overflow-auto rounded bg-gray-200 p-4 text-sm">
                        {JSON.stringify(items, null, 2)}
                      </pre>
                    </details>
                  ),
                )}
              </div>
            </details>
            <details className="rounded bg-gray-50 p-4">
              <summary className="cursor-pointer font-medium">Metrics</summary>
              <div className="mt-2 space-y-2">
                {Object.entries(groupByCategory(metadataMetrics)).map(
                  ([category, items]) => (
                    <details key={category} className="rounded bg-gray-100 p-4">
                      <summary className="cursor-pointer font-medium">
                        {category}
                      </summary>
                      <pre className="mt-2 overflow-auto rounded bg-gray-200 p-4 text-sm">
                        {JSON.stringify(items, null, 2)}
                      </pre>
                    </details>
                  ),
                )}
              </div>
            </details>
          </div>
        )}
      </div>
    </details>
  );
};
