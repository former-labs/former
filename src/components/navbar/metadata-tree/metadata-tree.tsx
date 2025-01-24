"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/DataContext";
import { PATH_DATABASE_METADATA } from "@/lib/paths";
import type { Dataset, Field, Project, Table } from "@/types/connections";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Type augmentations for search functionality
type TableExtended = Table & {
  _originalFieldCount?: number;
};

type DatasetExtended = Omit<Dataset, "tables"> & {
  _originalTableCount?: number;
  tables: TableExtended[];
};

type ProjectExtended = Omit<Project, "datasets"> & {
  _originalDatasetCount?: number;
  datasets: DatasetExtended[];
};

type FieldExtended = Field;

// Main component
export function MetadataTree() {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { databaseMetadata, isFetchingMetadata } = useData();
  const router = useRouter();

  useEffect(() => {
    // Initialize with all project IDs expanded
    if (databaseMetadata?.projects) {
      const projectIds = new Set<string>();
      databaseMetadata.projects.forEach((project) => {
        if (project.id) projectIds.add(project.id);
      });
      setExpandedProjects(projectIds);
    }
  }, [databaseMetadata]);

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
  }, [searchQuery, databaseMetadata]);

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
        <SidebarGroupLabel>Schema</SidebarGroupLabel>

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
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pt-2">
          {isFetchingMetadata ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : databaseMetadata ? (
            <Button
              variant="destructive"
              className="w-full justify-start p-8"
              onClick={() => router.push(PATH_DATABASE_METADATA)}
            >
              <span className="text-wrap">
                No database schema found. Upload schema
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
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
              />
            ))
          )}
        </div>
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
}: {
  project: ProjectExtended;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedDatasets: Set<string>;
  toggleDataset: (id: string) => void;
  expandedTables: Set<string>;
  toggleTable: (id: string) => void;
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
}: {
  projectId: string;
  dataset: DatasetExtended;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedTables: Set<string>;
  toggleTable: (id: string) => void;
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
          {dataset.tables.map((table) => (
            <TableItem
              key={table.id}
              projectId={projectId}
              datasetId={dataset.id}
              table={table}
              searchQuery={searchQuery}
              isExpanded={expandedTables.has(table.id)}
              onToggle={() => toggleTable(table.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Component for table items
function TableItem({
  projectId,
  datasetId,
  table,
  searchQuery,
  isExpanded,
  onToggle,
}: {
  projectId: string;
  datasetId: string;
  table: TableExtended;
  searchQuery: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { setTableIncludedInAIContext } = useData();

  return (
    <div className="space-y-0.5">
      <div className="flex w-full items-center">
        <Checkbox
          checked={table.includedInAIContext}
          onClick={(e) => {
            e.stopPropagation();
            setTableIncludedInAIContext({
              projectId,
              datasetId,
              tableId: table.id,
              value: !table.includedInAIContext,
            });
          }}
          className="ml-2"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-start gap-2"
          onClick={onToggle}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full items-center gap-2">
                <TableIcon className="h-4 w-4" />
                <span className="truncate">
                  <HighlightedText text={table.name} query={searchQuery} />
                </span>
                <span className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary">
                    {table._originalFieldCount ?? table.fields?.length ?? 0}
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
                    <HighlightedText text={table.name} query={searchQuery} />
                  </span>
                  <Badge variant="secondary">
                    {table._originalFieldCount ?? table.fields?.length ?? 0}{" "}
                    fields
                  </Badge>
                </div>
                <div>
                  {table?.description ? (
                    <HighlightedText
                      text={table.description}
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
          {table.fields?.map((field) => (
            <FieldItem
              key={field.name}
              projectId={projectId}
              datasetId={datasetId}
              tableId={table.id}
              field={field}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Component for field items
function FieldItem({
  projectId,
  datasetId,
  tableId,
  field,
  searchQuery,
  level = 0,
}: {
  projectId: string;
  datasetId: string;
  tableId: string;
  field: FieldExtended;
  searchQuery: string;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasNestedFields = field.fields && field.fields.length > 0;

  return (
    <div className="space-y-0.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-full justify-start gap-2"
        onClick={() => hasNestedFields && setIsExpanded(!isExpanded)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {hasNestedFields &&
                  (isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ))}
                <span className="flex-grow truncate text-left">
                  <HighlightedText text={field.name} query={searchQuery} />
                </span>
              </div>
              <Badge
                variant="secondary"
                className="ml-auto truncate bg-blue-100"
              >
                {field.type}
                {hasNestedFields && ` (${field.fields?.length})`}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-x-2">
                <div className="font-semibold">
                  <HighlightedText text={field.name} query={searchQuery} />
                </div>
                <Badge variant="secondary">
                  {field.type}
                  {hasNestedFields && ` (${field.fields?.length})`}
                </Badge>
              </div>
              <div>
                {field.description ? (
                  <HighlightedText
                    text={field.description}
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
      {isExpanded && hasNestedFields && (
        <div className={`space-y-0.5 pl-${level > 0 ? "4" : "6"}`}>
          {field.fields?.map((nestedField) => (
            <FieldItem
              key={nestedField.name}
              projectId={projectId}
              datasetId={datasetId}
              tableId={tableId}
              field={nestedField}
              searchQuery={searchQuery}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for highlighting search matches
function HighlightedText({ text, query }: { text: string; query: string }) {
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
}
