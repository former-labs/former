"use client";

import {
  type DatasetExtended,
  type ProjectExtended,
  type TableExtended
} from "./common";

type FilteredData = {
  filteredProjects: ProjectExtended[];
  expandedFromSearch: {
    projects: Set<string>;
    datasets: Set<string>;
    tables: Set<string>;
  };
};

export function filterMetadataBySearch(
  projects: ProjectExtended[] | undefined,
  searchQuery: string,
): FilteredData {
  if (!projects || !searchQuery)
    return {
      filteredProjects: projects ?? [],
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

  const filtered = projects
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
          (dataset): dataset is NonNullable<typeof dataset> => dataset !== null,
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
}