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
                <Database className="h-4 w-4" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate">{project.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>{project.name}</TooltipContent>
                </Tooltip>
                {expandedProjects.has(project.id) ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
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
                        <Database className="h-4 w-4" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate">{dataset.name}</span>
                          </TooltipTrigger>
                          <TooltipContent>{dataset.name}</TooltipContent>
                        </Tooltip>
                        {expandedDatasets.has(dataset.id) ? (
                          <ChevronDown className="ml-auto h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
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
                                <Table className="h-4 w-4" />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="truncate">
                                      {table.name}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{table.name}</TooltipContent>
                                </Tooltip>
                                {expandedTables.has(table.id) ? (
                                  <ChevronDown className="ml-auto h-4 w-4" />
                                ) : (
                                  <ChevronRight className="ml-auto h-4 w-4" />
                                )}
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
                                          <span className="truncate">
                                            {field.name}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {field.name}
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="ml-auto truncate">
                                            {field.type}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {field.type}
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
