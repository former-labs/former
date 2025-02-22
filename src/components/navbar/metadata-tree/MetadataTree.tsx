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
import { useIntegrations } from "@/contexts/DataContext";
import { env } from "@/env";
import { PATH_INTEGRATIONS } from "@/lib/paths";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HighlightedText, type ProjectExtended } from "./common";
import { DatasetItem } from "./DatasetItem";
import { filterMetadataBySearch } from "./filterMetadataBySearch";

export function MetadataTree() {
  const { databaseMetadata, isFetchingMetadata } = useDatabaseMetadata();
  const { activeIntegration } = useIntegrations();
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

  const shouldShowContent =
    env.NEXT_PUBLIC_PLATFORM === "web" || activeIntegration;

  const handleSearchChange = (newSearchTerm: string) => {
    if (newSearchTerm === "" && searchQuery !== "") {
      // setExpandedProjects(new Set());
      setExpandedDatasets(new Set());
      setExpandedTables(new Set());
    }
    setSearchQuery(newSearchTerm);
  };

  return (
    <TooltipProvider>
      <SidebarGroup className="flex h-full flex-col">
        <SidebarGroupLabel>
          {env.NEXT_PUBLIC_PLATFORM === "web"
            ? "Database Schema"
            : "Active Integration"}
        </SidebarGroupLabel>

        {env.NEXT_PUBLIC_PLATFORM === "desktop" && <IntegrationDropdown />}

        {shouldShowContent && (
          <>
            <div className="mb-1 px-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
              ) : !databaseMetadata ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-md bg-muted p-4">
                  <div className="text-center text-sm text-muted-foreground">
                    {env.NEXT_PUBLIC_PLATFORM === "web" ? (
                      <>No metadata found</>
                    ) : (
                      <>
                        No metadata found for{" "}
                        <strong>{activeIntegration?.name}</strong>
                      </>
                    )}
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

function IntegrationDropdown() {
  const router = useRouter();
  const { activeIntegration, integrations, setActiveIntegration } =
    useIntegrations();

  return (
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
                <SelectItem key={integration.id} value={integration.id ?? ""}>
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
            onClick={() => router.push(PATH_INTEGRATIONS)}
          >
            <span className="truncate">Configure integrations</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
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
