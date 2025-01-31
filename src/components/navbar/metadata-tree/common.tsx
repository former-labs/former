"use client";

import type { Dataset, Field, Project, Table } from "@/types/connections";

// Type augmentations for search functionality
export type TableExtended = Table & {
  _originalFieldCount?: number;
};

export type DatasetExtended = Omit<Dataset, "tables"> & {
  _originalTableCount?: number;
  tables: TableExtended[];
};

export type ProjectExtended = Omit<Project, "datasets"> & {
  _originalDatasetCount?: number;
  datasets: DatasetExtended[];
};

export type FieldExtended = Field;

export type CheckboxState = {
  checked: boolean;
  indeterminate: boolean;
};

// Helper functions for computing checkbox states
export function getDatasetCheckboxState(
  dataset: DatasetExtended,
): CheckboxState {
  const includedTables = dataset.tables.filter((t) => t.includedInAIContext);
  return {
    checked:
      includedTables.length === dataset.tables.length &&
      dataset.tables.length > 0,
    indeterminate:
      includedTables.length > 0 &&
      includedTables.length < dataset.tables.length,
  };
}

// Helper component for highlighting search matches
export function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
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
