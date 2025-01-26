"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/DataContext";
import { ChevronDown, ChevronRight, Table as TableIcon } from "lucide-react";
import { FieldItem } from "./FieldItem";
import { HighlightedText, type TableExtended } from "./common";

// Component for table items
export function TableItem({
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
