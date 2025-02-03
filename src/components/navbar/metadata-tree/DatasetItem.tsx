"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDatabaseMetadata } from "@/contexts/databaseMetadataStore";
import { useIntegrations } from "@/contexts/DataContext";
import { ChevronDown, ChevronRight, Database } from "lucide-react";
import { type DatasetExtended, HighlightedText } from "./common";
import { TableItem } from "./TableItem";

// Component for dataset items
export function DatasetItem({
  projectId,
  dataset,
  searchQuery,
  isExpanded,
  onToggle,
  expandedTables,
  toggleTable,
  hideEmptyDatabases,
}: {
  projectId: string;
  dataset: DatasetExtended;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedTables: Set<string>;
  toggleTable: (id: string) => void;
  hideEmptyDatabases: boolean;
}) {
  const { activeIntegration } = useIntegrations();
  const { fetchTablesForDataset, loadingDatasets } = useDatabaseMetadata();

  const handleToggle = async () => {
    onToggle();
    if (!isExpanded && activeIntegration?.id) {
      await fetchTablesForDataset(activeIntegration.id, dataset.id);
    }
  };

  const isLoading = loadingDatasets.has(dataset.id);

  if (
    hideEmptyDatabases &&
    (dataset.tableCount ??
      dataset._originalTableCount ??
      dataset.tables.length) === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2"
        onClick={handleToggle}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="truncate">
                <HighlightedText text={dataset.name} query={searchQuery} />
              </span>
              <span className="ml-auto flex items-center gap-2">
                <Badge variant="secondary">
                  {dataset.tableCount ??
                    dataset._originalTableCount ??
                    dataset.tables.length}
                </Badge>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  <HighlightedText text={dataset.name} query={searchQuery} />
                </span>
                <Badge variant="secondary">
                  {dataset.tableCount ??
                    dataset._originalTableCount ??
                    dataset.tables.length}{" "}
                  tables
                </Badge>
              </div>
              <div>
                {dataset.description ? (
                  <HighlightedText
                    text={dataset.description}
                    query={searchQuery}
                  />
                ) : (
                  "No description available"
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </Button>
      {isExpanded && (
        <div className="pl-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 pl-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
              <span className="text-sm text-muted-foreground">
                Loading tables...
              </span>
            </div>
          ) : (
            dataset.tables.map((table) => (
              <TableItem
                key={table.id}
                projectId={projectId}
                datasetId={dataset.id}
                table={table}
                searchQuery={searchQuery}
                isExpanded={expandedTables.has(table.id)}
                onToggle={() => toggleTable(table.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
