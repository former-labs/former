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
import { useData } from "@/contexts/DataContext";
import { useVirtualizer } from "@tanstack/react-virtual";
import debounce from "lodash/debounce";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DatasetExtended,
  HighlightedText,
  type ProjectExtended,
  type TableExtended,
  getDatasetCheckboxState,
} from "./common";
import { TableItem } from "./TableItem";

// Error boundary component
class MetadataTreeErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MetadataTree error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm text-red-500">
          <p>Error loading metadata tree.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the main component with error boundary
export function MetadataTree() {
  return (
    <MetadataTreeErrorBoundary>
      <MetadataTreeContent />
    </MetadataTreeErrorBoundary>
  );
}

// Main component content
function MetadataTreeContent() {
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

  const { filteredProjects, expandedFromSearch } = useMemo<{
    filteredProjects: ProjectExtended[];
    expandedFromSearch: {
      projects: Set<string>;
      datasets: Set<string>;
      tables: Set<string>;
    };
  }>(() => {
    if (!databaseMetadata?.projects || !searchQuery)
      return {
        filteredProjects: (databaseMetadata?.projects ??
          []) as ProjectExtended[],
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
      .map((project): ProjectExtended | null => {
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
                  : filteredTables) as TableExtended[],
                _originalTableCount: originalTableCount,
              } as DatasetExtended;
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
        (project): project is NonNullable<ProjectExtended> => project !== null,
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
  const {
    activeIntegration,
    fetchTablesForDataset,
    loadingDatasets,
    loadingCheckboxes,
    setDatasetIncludedInAIContext,
    loadedDatasets,
    fetchAllTablesForDataset,
  } = useData();

  // Debounce the checkbox change handler
  const debouncedSetDatasetIncluded = useMemo(
    () =>
      debounce(
        (params: { projectId: string; datasetId: string; value: boolean }) =>
          setDatasetIncludedInAIContext(params),
        300,
      ),
    [setDatasetIncludedInAIContext],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetDatasetIncluded.cancel();
    };
  }, [debouncedSetDatasetIncluded]);

  const handleCheckboxChange = async (checked: boolean) => {
    try {
      if (checked && !loadedDatasets.has(dataset.id)) {
        onToggle();
        await fetchAllTablesForDataset(projectId, dataset.id);
      }
      debouncedSetDatasetIncluded({
        projectId,
        datasetId: dataset.id,
        value: checked,
      });
    } catch (error) {
      console.error("Failed to update dataset:", error);
    }
  };

  const handleToggle = async () => {
    onToggle();
    if (!isExpanded && activeIntegration?.id) {
      await fetchTablesForDataset(activeIntegration.id, dataset.id);
    }
  };

  // Use the helper function for checkbox state
  const checkboxState = useMemo(
    () => getDatasetCheckboxState(dataset),
    [dataset],
  );

  const isLoading = loadingDatasets.has(dataset.id);
  const isCheckboxLoading = loadingCheckboxes.has(dataset.id);

  // Virtual list for tables with reduced height
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: dataset.tables.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 32, []), // Reduced from 40 to 32
    overscan: 5,
  });

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
      <div className="flex w-full items-center">
        <Checkbox
          checked={checkboxState.checked}
          indeterminate={checkboxState.indeterminate}
          disabled={isCheckboxLoading}
          onClick={(e) => {
            e.stopPropagation();
            void handleCheckboxChange(!checkboxState.checked);
          }}
          className="ml-2"
        />
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
                  {isCheckboxLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
                  )}
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
      </div>
      {isExpanded && (
        <div className="pl-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-1 pl-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
              <span className="text-sm text-muted-foreground">
                Loading tables...
              </span>
            </div>
          ) : (
            <div ref={parentRef} className="max-h-[400px] overflow-y-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const table = dataset.tables[virtualRow.index];
                  if (!table) return null;

                  return (
                    <div
                      key={table.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <TableItem
                        projectId={projectId}
                        datasetId={dataset.id}
                        table={table}
                        searchQuery={searchQuery}
                        isExpanded={expandedTables.has(table.id)}
                        onToggle={() => toggleTable(table.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
