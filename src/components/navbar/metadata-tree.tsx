"use client";

import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/DataContext";
import { ChevronDown, ChevronRight, Database, Table } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";

export function MetadataTree() {
  const { warehouseMetadata, isFetchingMetadata } = useData();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(
    new Set(),
  );
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  if (isFetchingMetadata) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!warehouseMetadata) return null;

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
        <SidebarGroupLabel>Active Project Schema</SidebarGroupLabel>
        <div className="space-y-1">
          {warehouseMetadata.projects.map((project) => (
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
                      <div>Project: {project.name}</div>
                      <div>Datasets: {project.datasets.length}</div>
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
                              <div>Dataset: {dataset.name}</div>
                              <div>Tables: {dataset.tables.length}</div>
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
                                      <div>Table: {table.name}</div>
                                      <div>
                                        Fields: {table.fields?.length || 0}
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
                                            <div>Field: {field.name}</div>
                                            <div>Type: {field.type}</div>
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
          ))}
        </div>
      </SidebarGroup>
    </TooltipProvider>
  );
}
