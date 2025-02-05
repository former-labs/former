import type { DatabaseInstructions, DatabaseType } from "@/types/connections";

export const DATABASE_INSTRUCTIONS: Record<DatabaseType, DatabaseInstructions> = {
  bigquery: {
    type: "bigquery",
    query: `\
SELECT 
  cp.table_catalog AS project_id,
  cp.table_schema AS dataset_id,
  cp.table_name,
  '' AS table_description,
  cp.column_name,
  cp.data_type,
  cp.description AS column_description
FROM \`<YOUR_PROJECT_ID>.<YOUR_DATASET_ID>.INFORMATION_SCHEMA.COLUMN_FIELD_PATHS\` AS cp
JOIN \`<YOUR_PROJECT_ID>.<YOUR_DATASET_ID>.INFORMATION_SCHEMA.COLUMNS\` AS c
  ON cp.table_catalog = c.table_catalog
 AND cp.table_schema  = c.table_schema
 AND cp.table_name    = c.table_name
 AND cp.column_name   = c.column_name
ORDER BY cp.table_schema, cp.table_name, c.ordinal_position;`,
    description:
      "Run this query in BigQuery and export the results as CSV. This will fetch all column information from your BigQuery project. Note that descriptions are not available through INFORMATION_SCHEMA and will need to be added manually.",
    columnMappings: {
      projectId: "project_id",
      datasetId: "dataset_id",
      tableName: "table_name",
      tableDescription: "table_description",
      columnName: "column_name",
      columnType: "data_type",
      columnDescription: "column_description",
    },
  },
  postgres: {
    type: "postgres",
    query: `\
SELECT 
  c.table_catalog as project_id,
  c.table_schema as dataset_id,
  c.table_name,
  pd.description as table_description,
  c.column_name,
  c.data_type,
  cd.description as column_description
FROM information_schema.columns c
LEFT JOIN pg_class pc ON pc.relname = c.table_name
LEFT JOIN pg_description pd ON pd.objoid = pc.oid AND pd.objsubid = 0
LEFT JOIN pg_description cd ON cd.objoid = pc.oid AND cd.objsubid = c.ordinal_position
WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY c.table_schema, c.table_name, c.ordinal_position`,
    description:
      "Run this query in PostgreSQL and export the results as CSV. This will fetch all column information along with table and column descriptions from your PostgreSQL database.",
    columnMappings: {
      projectId: "project_id",
      datasetId: "dataset_id",
      tableName: "table_name",
      tableDescription: "table_description",
      columnName: "column_name",
      columnType: "data_type",
      columnDescription: "column_description",
    },
  },
  mysql: {
    type: "mysql",
    query: `\
SELECT 
  c.table_schema AS project_id,
  c.table_schema AS dataset_id,
  c.table_name,
  t.table_comment AS table_description,
  c.column_name,
  c.data_type,
  c.column_comment AS column_description
FROM information_schema.columns AS c
JOIN information_schema.tables AS t
  ON c.table_schema = t.table_schema 
  AND c.table_name = t.table_name
WHERE c.table_schema NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;`,
    description:
      "Run this query in MySQL and export the results as CSV. This will fetch all column information along with table comments and column comments from your MySQL database.",
    columnMappings: {
      projectId: "project_id",
      datasetId: "dataset_id",
      tableName: "table_name",
      tableDescription: "table_description",
      columnName: "column_name",
      columnType: "data_type",
      columnDescription: "column_description",
    },
  },
  sqlserver: {
    type: "sqlserver",
    query: `\
SELECT 
  DB_NAME() as project_id,
  SCHEMA_NAME(t.schema_id) as dataset_id,
  t.name as table_name,
  CAST(p.value AS NVARCHAR(MAX)) as table_description,
  c.name as column_name,
  typ.name as data_type,
  CAST(ep.value AS NVARCHAR(MAX)) as column_description
FROM sys.tables t
INNER JOIN sys.columns c ON c.object_id = t.object_id
INNER JOIN sys.types typ ON typ.user_type_id = c.user_type_id
LEFT JOIN sys.extended_properties p ON p.major_id = t.object_id AND p.minor_id = 0 AND p.class = 1
LEFT JOIN sys.extended_properties ep ON ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.class = 1
ORDER BY SCHEMA_NAME(t.schema_id), t.name, c.column_id`,
    description:
      "Run this query in SQL Server and export the results as CSV. This will fetch all column information along with extended properties for table and column descriptions.",
    columnMappings: {
      projectId: "project_id",
      datasetId: "dataset_id",
      tableName: "table_name",
      tableDescription: "table_description",
      columnName: "column_name",
      columnType: "data_type",
      columnDescription: "column_description",
    },
  },
  snowflake: {
    type: "snowflake",
    query: `\
SELECT 
  current_database() as project_id,
  table_schema as dataset_id,
  table_name,
  comment as table_description,
  column_name,
  data_type,
  column_comment as column_description
FROM information_schema.columns
NATURAL LEFT JOIN information_schema.tables
WHERE table_schema NOT IN ('INFORMATION_SCHEMA')
ORDER BY table_schema, table_name, ordinal_position`,
    description:
      "Run this query in Snowflake and export the results as CSV. This will fetch all column information along with table and column comments from your Snowflake database.",
    columnMappings: {
      projectId: "project_id",
      datasetId: "dataset_id",
      tableName: "table_name",
      tableDescription: "table_description",
      columnName: "column_name",
      columnType: "data_type",
      columnDescription: "column_description",
    },
  },
  databricks: {
    type: "databricks",
    query: `\
SELECT 
  current_database() as project_id,
  table_schema as dataset_id,
  table_name,
  comment as table_description,
  column_name,
  data_type,
  comment as column_description
FROM information_schema.columns
NATURAL LEFT JOIN information_schema.tables
WHERE table_schema NOT IN ('information_schema')
ORDER BY table_schema, table_name, ordinal_position`,
    description:
      "Run this query in Databricks and export the results as CSV. This will fetch all column information along with table and column comments from your Databricks database.",
    columnMappings: {
      projectId: "project_id",
      datasetId: "dataset_id",
      tableName: "table_name",
      tableDescription: "table_description",
      columnName: "column_name",
      columnType: "data_type",
      columnDescription: "column_description",
    },
  },
}; 