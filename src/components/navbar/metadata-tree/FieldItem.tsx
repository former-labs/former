"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { type FieldExtended, HighlightedText } from "./common";

// Component for field items
export function FieldItem({
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
