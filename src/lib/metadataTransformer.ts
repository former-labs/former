import type { DatabaseMetadata, DatabaseType, Dataset, Project, Table } from "@/types/connections";

export type CSVRow = Record<string, string>;

export interface ColumnMappings {
  projectId: string;
  datasetId: string;
  tableName: string;
  tableDescription?: string;
  columnName: string;
  columnType: string;
  columnDescription?: string;
}

export const transformToMetadata = ({
  data,
  mappings,
  databaseType,
}: {
  data: CSVRow[];
  mappings: ColumnMappings;
  databaseType: DatabaseType;
}): DatabaseMetadata => {
  // Just print the database type for now
  const projectMap = new Map<string, Project>();

  data.forEach((row) => {
    const projectId = row[mappings.projectId] || "default";
    const datasetId = row[mappings.datasetId] || "default";
    const tableId = row[mappings.tableName];

    if (!tableId) return;

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        id: projectId,
        name: projectId,
        description: null,
        datasets: [],
      });
    }

    const project = projectMap.get(projectId)!;
    let dataset = project.datasets.find((d: Dataset) => d.id === datasetId);

    if (!dataset) {
      dataset = {
        id: datasetId,
        name: datasetId,
        description: null,
        tableCount: 0,
        tables: [],
      };
      project.datasets.push(dataset);
    }

    let table = dataset.tables.find((t: Table) => t.id === tableId);

    if (!table) {
      const tableDescription =
        mappings.tableDescription && row[mappings.tableDescription];
      table = {
        id: tableId,
        name: tableId,
        description: tableDescription || null,
        fields: [],
        includedInAIContext: true,
      };
      dataset.tables.push(table);
      dataset.tableCount++;
    }

    const columnName = row[mappings.columnName];
    const columnType = row[mappings.columnType];
    const columnDescription =
      mappings.columnDescription && row[mappings.columnDescription];

    if (!columnName || !columnType) return;

    table.fields.push({
      name: columnName,
      type: columnType,
      description: columnDescription || null,
    });
  });

  return {
    dialect: databaseType,
    projects: Array.from(projectMap.values()),
  };
} 