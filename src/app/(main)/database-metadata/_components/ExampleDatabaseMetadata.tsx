export const ExampleDatabaseMetadata = () => {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm text-muted-foreground">
        View example schema format
      </summary>
      <div className="mt-2 rounded-lg border p-4">
        <p className="mb-2 text-sm text-muted-foreground">
          This is an example of the expected schema format:
        </p>
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {JSON.stringify(
            {
              dialect: "bigquery",
              projects: [
                {
                  id: "example-project",
                  name: "Example Project",
                  datasets: [
                    {
                      id: "example-dataset",
                      name: "Example Dataset",
                      tables: [
                        {
                          id: "table1",
                          name: "Table 1",
                          fields: [
                            {
                              name: "field1",
                              type: "STRING",
                              description: "First field in the table",
                            },
                            {
                              name: "field2",
                              type: "INTEGER",
                              description: "Second field in the table",
                            },
                            {
                              name: "field3",
                              type: "BOOLEAN",
                              description: "Third field in the table",
                            },
                          ],
                          description: "First table example",
                        },
                        {
                          id: "table2",
                          name: "Table 2",
                          fields: [
                            {
                              name: "field1",
                              type: "FLOAT",
                              description: "First field in the table",
                            },
                            {
                              name: "field2",
                              type: "DATE",
                              description: "Second field in the table",
                            },
                            {
                              name: "field3",
                              type: "STRING",
                              description: "Third field in the table",
                            },
                          ],
                          description: "Second table example",
                        },
                      ],
                      tableCount: 2,
                      description:
                        "A dataset containing two tables with three fields each",
                    },
                  ],
                  description: "A project to demonstrate schema parsing",
                },
              ],
            },
            null,
            2,
          )}
        </pre>
      </div>
    </details>
  );
};
