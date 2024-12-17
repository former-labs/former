"use client";

import { Button } from "@/components/ui/button";
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
import { useData } from "@/contexts/DataContext";
import type { DatabaseMetadata } from "@/types/connections";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
  Table,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

type TableWithCounts =
  DatabaseMetadata["projects"][0]["datasets"][0]["tables"][0] & {
    _originalFieldCount?: number;
  };

type DatasetWithCounts = DatabaseMetadata["projects"][0]["datasets"][0] & {
  _originalTableCount?: number;
  tables: TableWithCounts[];
};

type ProjectWithCounts = DatabaseMetadata["projects"][0] & {
  _originalDatasetCount?: number;
  datasets: DatasetWithCounts[];
};

export function MetadataTree() {
  const router = useRouter();
  const {
    databaseMetadata,
    isFetchingMetadata,
    activeIntegration,
    integrations,
    setActiveIntegration,
  } = useData();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className="bg-yellow-200">
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const { filteredProjects, expandedFromSearch } = useMemo<{
    filteredProjects: ProjectWithCounts[];
    expandedFromSearch: {
      projects: Set<string>;
      datasets: Set<string>;
      tables: Set<string>;
    };
  }>(() => {
    if (!databaseMetadata?.projects || !searchQuery)
      return {
        filteredProjects: (databaseMetadata?.projects ??
          []) as ProjectWithCounts[],
        expandedFromSearch: {
          projects: new Set<string>(),
          datasets: new Set<string>(),
          tables: new Set<string>(),
        },
      };

    const query = searchQuery.toLowerCase();
    const toExpand = {
      projects: new Set<string>(),
      datasets: new Set<string>(),
      tables: new Set<string>(),
    };

    const filtered = databaseMetadata.projects
      .map((project): ProjectWithCounts | null => {
        if (!project) return null;

        const projectMatches =
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query);

        const originalDatasetCount = project.datasets.length;

        const filteredDatasets = project.datasets
          .map((dataset) => {
            if (!dataset) return null;

            const datasetMatches =
              dataset.name.toLowerCase().includes(query) ||
              dataset.description?.toLowerCase().includes(query);

            const originalTableCount = dataset.tables.length;

            const filteredTables = dataset.tables
              .map((table) => {
                const tableMatches =
                  table.name.toLowerCase().includes(query) ||
                  table.description?.toLowerCase().includes(query);

                const originalFieldCount = table.fields?.length || 0;

                const matchingFields = table.fields?.filter(
                  (field) =>
                    field.name.toLowerCase().includes(query) ||
                    field.description?.toLowerCase().includes(query),
                );

                if (tableMatches || matchingFields?.length) {
                  if (tableMatches || matchingFields?.length) {
                    toExpand.projects.add(project.id);
                    toExpand.datasets.add(dataset.id);
                  }
                  if (matchingFields?.length) {
                    toExpand.tables.add(table.id);
                  }
                  return {
                    ...table,
                    fields: tableMatches ? table.fields : matchingFields,
                    _originalFieldCount: originalFieldCount,
                  };
                }
                return null;
              })
              .filter(Boolean);

            if (datasetMatches || filteredTables.length > 0) {
              if (datasetMatches || filteredTables.length > 0) {
                toExpand.projects.add(project.id);
              }
              return {
                ...dataset,
                tables: (datasetMatches
                  ? dataset.tables
                  : filteredTables) as TableWithCounts[],
                _originalTableCount: originalTableCount,
              } as DatasetWithCounts;
            }
            return null;
          })
          .filter(
            (dataset): dataset is NonNullable<typeof dataset> =>
              dataset !== null,
          );

        if (projectMatches || filteredDatasets.length > 0) {
          return {
            ...project,
            datasets: projectMatches ? project.datasets : filteredDatasets,
            _originalDatasetCount: originalDatasetCount,
          };
        }
        return null;
      })
      .filter(
        (project): project is NonNullable<ProjectWithCounts> =>
          project !== null,
      );

    return { filteredProjects: filtered, expandedFromSearch: toExpand };
  }, [databaseMetadata?.projects, searchQuery]);

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
      <SidebarGroup>
        <SidebarGroupLabel>Active Integration</SidebarGroupLabel>

        {integrations.length > 0 ? (
          <div className="mb-2 px-2">
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
                  <SelectItem key={integration.id} value={integration.id ?? ""}>
                    {integration.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="mb-2 px-2">
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

        <div className="mb-2 px-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[calc(100vh-200px)] space-y-1 overflow-y-auto">
          {isFetchingMetadata ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : !databaseMetadata && activeIntegration ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-md bg-muted p-4">
              <div className="text-center text-sm text-muted-foreground">
                No metadata found for <strong>{activeIntegration.name}</strong>
              </div>
            </div>
          ) : (
            filteredProjects?.map((project: ProjectWithCounts) => (
              <div key={project.id} className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start gap-2"
                  onClick={() => toggleProject(project.id)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex w-full items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="truncate">
                          {highlightMatch(project.name, searchQuery)}
                        </span>
                        <span className="ml-auto flex items-center gap-2">
                          <Badge variant="secondary">
                            {project._originalDatasetCount ||
                              project.datasets.length}
                          </Badge>
                          {expandedProjects.has(project.id) ? (
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
                            {highlightMatch(project.name, searchQuery)}
                          </span>
                          <Badge variant="secondary">
                            {project._originalDatasetCount ||
                              project.datasets.length}{" "}
                            datasets
                          </Badge>
                        </div>
                        <div>
                          {project.description
                            ? highlightMatch(project.description, searchQuery)
                            : "No description available"}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </Button>
                {expandedProjects.has(project.id) && (
                  <div className="space-y-1 pl-4">
                    {project.datasets.map((dataset: DatasetWithCounts) => (
                      <div key={dataset.id} className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full justify-start gap-2"
                          onClick={() => toggleDataset(dataset.id)}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex w-full items-center gap-2">
                                <Database className="h-4 w-4" />
                                <span className="truncate">
                                  {highlightMatch(dataset.name, searchQuery)}
                                </span>
                                <span className="ml-auto flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {dataset._originalTableCount ||
                                      dataset.tables.length}
                                  </Badge>
                                  {expandedDatasets.has(dataset.id) ? (
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
                                    {highlightMatch(dataset.name, searchQuery)}
                                  </span>
                                  <Badge variant="secondary">
                                    {dataset._originalTableCount ||
                                      dataset.tables.length}{" "}
                                    tables
                                  </Badge>
                                </div>
                                <div>
                                  {dataset.description
                                    ? highlightMatch(
                                        dataset.description,
                                        searchQuery,
                                      )
                                    : "No description available"}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </Button>
                        {expandedDatasets.has(dataset.id) && (
                          <div className="space-y-1 pl-4">
                            {dataset.tables.map((table: TableWithCounts) => (
                              <div key={table.id} className="space-y-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-full justify-start gap-2"
                                  onClick={() => toggleTable(table.id)}
                                >
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex w-full items-center gap-2">
                                        <Table className="h-4 w-4" />
                                        <span className="truncate">
                                          {highlightMatch(
                                            table.name,
                                            searchQuery,
                                          )}
                                        </span>
                                        <span className="ml-auto flex items-center gap-2">
                                          <Badge variant="secondary">
                                            {table._originalFieldCount ||
                                              table.fields?.length ||
                                              0}
                                          </Badge>
                                          {expandedTables.has(table.id) ? (
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
                                            {highlightMatch(
                                              table.name,
                                              searchQuery,
                                            )}
                                          </span>
                                          <Badge variant="secondary">
                                            {table._originalFieldCount ||
                                              table.fields?.length ||
                                              0}{" "}
                                            fields
                                          </Badge>
                                        </div>
                                        <div>
                                          {table?.description
                                            ? highlightMatch(
                                                table.description,
                                                searchQuery,
                                              )
                                            : "No description available"}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </Button>
                                {expandedTables.has(table.id) && (
                                  <div className="space-y-1 pl-4">
                                    {table.fields?.map((field) => (
                                      <Button
                                        key={field.name}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-full justify-start gap-2"
                                      >
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex w-full items-center justify-between gap-2">
                                              <span className="flex-grow truncate text-left">
                                                {highlightMatch(
                                                  field.name,
                                                  searchQuery,
                                                )}
                                              </span>
                                              <Badge
                                                variant="secondary"
                                                className="ml-auto truncate bg-blue-100"
                                              >
                                                {field.type}
                                              </Badge>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="flex flex-col gap-1">
                                              <div className="flex items-center gap-x-2">
                                                <div className="font-semibold">
                                                  {highlightMatch(
                                                    field.name,
                                                    searchQuery,
                                                  )}
                                                </div>
                                                <Badge variant="secondary">
                                                  {field.type}
                                                </Badge>
                                              </div>
                                              <div>
                                                {field.description
                                                  ? highlightMatch(
                                                      field.description,
                                                      searchQuery,
                                                    )
                                                  : "No description available"}
                                              </div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SidebarGroup>
    </TooltipProvider>
  );
}
