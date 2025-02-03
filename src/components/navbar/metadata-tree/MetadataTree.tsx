"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDatabaseMetadata } from "@/contexts/databaseMetadataStore";
import { useData } from "@/contexts/DataContext";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  type DatasetExtended,
  HighlightedText,
  type ProjectExtended,
} from "./common";
import { filterMetadataBySearch } from "./filterMetadataBySearch";
import { TableItem } from "./TableItem";

export function MetadataTree() {
  const router = useRouter();
  const { databaseMetadata, isFetchingMetadata } = useDatabaseMetadata();
  const { activeIntegration, integrations, setActiveIntegration } = useData();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [hideEmptyDatabases, setHideEmptyDatabases] = useState(true);

  useEffect(() => {
    // Initialize with all project IDs expanded
    if (!isFetchingMetadata && databaseMetadata?.projects) {
      const projectIds = new Set<string>();
      databaseMetadata.projects.forEach((project) => {
        if (project.id) projectIds.add(project.id);
      });
      setExpandedProjects(projectIds);
    }
  }, [isFetchingMetadata, databaseMetadata]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleDataset = (datasetId: string) => {
    setExpandedDatasets((prev) => {
      const next = new Set(prev);
      if (next.has(datasetId)) {
        next.delete(datasetId);
      } else {
        next.add(datasetId);
      }
      return next;
    });
  };

  const toggleTable = (tableId: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  const { filteredProjects, expandedFromSearch } = useMemo(
    () => filterMetadataBySearch(databaseMetadata?.projects, searchQuery),
    [databaseMetadata?.projects, searchQuery],
  );

  useEffect(() => {
    if (searchQuery) {
      setExpandedProjects((prev) => {
        const next = new Set(prev);
        expandedFromSearch.projects.forEach((id) => next.add(id));
        return next;
      });
      setExpandedDatasets((prev) => {
        const next = new Set(prev);
        expandedFromSearch.datasets.forEach((id) => next.add(id));
        return next;
      });
      setExpandedTables((prev) => {
        const next = new Set(prev);
        expandedFromSearch.tables.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [searchQuery, expandedFromSearch]);

  return (
    <TooltipProvider>
      <SidebarGroup className="flex h-full flex-col">
        <SidebarGroupLabel>Active Integration</SidebarGroupLabel>

        <div className="mb-1 px-2">
          {integrations.length > 0 ? (
            <div>
              <Select
                value={activeIntegration?.id ?? ""}
                onValueChange={(value) => {
                  const integration = integrations.find((i) => i.id === value);
                  if (integration) setActiveIntegration(integration);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select integration">
                    {activeIntegration?.name ?? "Select integration"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {integrations.map((integration) => (
                    <SelectItem
                      key={integration.id}
                      value={integration.id ?? ""}
                    >
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                size="sm"
                onClick={() => router.push("/integrations")}
              >
                <span className="truncate">Configure integrations</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {activeIntegration && (
          <>
            <div className="mb-1 px-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="my-4 flex items-center space-x-2">
                <Checkbox
                  id="hide-empty"
                  checked={hideEmptyDatabases}
                  onCheckedChange={(checked) =>
                    setHideEmptyDatabases(checked as boolean)
                  }
                />
                <label
                  htmlFor="hide-empty"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Hide databases with no tables
                </label>
              </div>
            </div>

            <div className="flex-1 space-y-0.5 overflow-y-auto">
              {isFetchingMetadata ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
                </div>
              ) : !databaseMetadata && activeIntegration ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-md bg-muted p-4">
                  <div className="text-center text-sm text-muted-foreground">
                    No metadata found for{" "}
                    <strong>{activeIntegration.name}</strong>
                  </div>
                </div>
              ) : (
                filteredProjects?.map((project) => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    searchQuery={searchQuery}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggle={() => toggleProject(project.id)}
                    expandedDatasets={expandedDatasets}
                    toggleDataset={toggleDataset}
                    expandedTables={expandedTables}
                    toggleTable={toggleTable}
                    hideEmptyDatabases={hideEmptyDatabases}
                  />
                ))
              )}
            </div>
          </>
        )}
      </SidebarGroup>
    </TooltipProvider>
  );
}

// Component for project items
function ProjectItem({
  project,
  searchQuery,
  isExpanded,
  onToggle,
  expandedDatasets,
  toggleDataset,
  expandedTables,
  toggleTable,
  hideEmptyDatabases,
}: {
  project: ProjectExtended;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedDatasets: Set<string>;
  toggleDataset: (id: string) => void;
  expandedTables: Set<string>;
  toggleTable: (id: string) => void;
  hideEmptyDatabases: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2"
        onClick={onToggle}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="truncate">
                <HighlightedText text={project.name} query={searchQuery} />
              </span>
              <span className="ml-auto flex items-center gap-2">
                <Badge variant="secondary">
                  {project._originalDatasetCount ?? project.datasets.length}
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
                  <HighlightedText text={project.name} query={searchQuery} />
                </span>
                <Badge variant="secondary">
                  {project._originalDatasetCount ?? project.datasets.length}{" "}
                  datasets
                </Badge>
              </div>
              <div>
                {project.description ? (
                  <HighlightedText
                    text={project.description}
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
        <div className="space-y-0.5 pl-4">
          {project.datasets.map((dataset) => (
            <DatasetItem
              key={dataset.id}
              projectId={project.id}
              dataset={dataset}
              searchQuery={searchQuery}
              isExpanded={expandedDatasets.has(dataset.id)}
              onToggle={() => toggleDataset(dataset.id)}
              expandedTables={expandedTables}
              toggleTable={toggleTable}
              hideEmptyDatabases={hideEmptyDatabases}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Component for dataset items
function DatasetItem({
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
  const { activeIntegration } = useData();
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
