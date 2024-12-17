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
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Database,
  Table,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "../ui/badge";

export function MetadataTree() {
  const router = useRouter();
  const {
    warehouseMetadata,
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

  return (
    <TooltipProvider>
      <SidebarGroup>
        <SidebarGroupLabel>Active Integration</SidebarGroupLabel>

        {integrations.length > 0 ? (
          <div className="mb-2 px-2">
            <Select
              value={activeIntegration?.id || ""}
              onValueChange={(value) => {
                const integration = integrations.find((i) => i.id === value);
                if (integration) setActiveIntegration(integration);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select integration">
                  {activeIntegration?.name || "Select integration"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {integrations.map((integration) => (
                  <SelectItem key={integration.id} value={integration.id || ""}>
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

        <div className="max-h-[calc(100vh-200px)] space-y-1 overflow-y-auto">
          {isFetchingMetadata ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : (
            warehouseMetadata?.projects.map((project) => (
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
                        <span className="truncate">{project.name}</span>
                        <span className="ml-auto flex items-center gap-2">
                          <Badge variant="secondary">
                            {project.datasets.length}
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
                          <span className="font-semibold">{project.name}</span>
                          <Badge variant="secondary">
                            {project.datasets.length} datasets
                          </Badge>
                        </div>
                        <div>
                          {project.description || "No description available"}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </Button>
                {expandedProjects.has(project.id) && (
                  <div className="space-y-1 pl-4">
                    {project.datasets.map((dataset) => (
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
                                <span className="truncate">{dataset.name}</span>
                                <span className="ml-auto flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {dataset.tables.length}
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
                                    {dataset.name}
                                  </span>
                                  <Badge variant="secondary">
                                    {dataset.tables.length} tables
                                  </Badge>
                                </div>
                                <div>
                                  {dataset.description ||
                                    "No description available"}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </Button>
                        {expandedDatasets.has(dataset.id) && (
                          <div className="space-y-1 pl-4">
                            {dataset.tables.map((table) => (
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
                                          {table.name}
                                        </span>
                                        <span className="ml-auto flex items-center gap-2">
                                          <Badge variant="secondary">
                                            {table.fields?.length || 0}
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
                                            {table.name}
                                          </span>
                                          <Badge variant="secondary">
                                            {table.fields?.length || 0} fields
                                          </Badge>
                                        </div>
                                        <div>
                                          {table?.description ||
                                            "No description available"}
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
                                            <div className="flex w-full items-center gap-2">
                                              <span className="truncate">
                                                {field.name}
                                              </span>
                                              <span className="ml-auto truncate">
                                                {field.type}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="flex flex-col gap-1">
                                              <div className="flex items-center gap-x-2">
                                                <div className="font-semibold">
                                                  {field.name}
                                                </div>
                                                <Badge variant="secondary">
                                                  {field.type}
                                                </Badge>
                                              </div>
                                              <div>
                                                {field.description ||
                                                  "No description available"}
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
