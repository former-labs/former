export default function Page() {
  return (
    <div className="mx-auto max-w-screen-xl px-6 py-24">
      <h1 className="mb-6 text-3xl font-bold">Getting Started</h1>

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Add Database Schema</h2>
          <p className="text-muted-foreground">
            Navigate to the Database Schema tab to add your database schema
            information. This helps the AI understand your database structure so
            it can generate accurate SQL queries.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Add Example Queries</h2>
          <p className="text-muted-foreground">
            Use the AI Knowledge tab to add example queries. This helps the AI
            understand how to write queries for your database so you don&apos;t
            need to write long prompts. The more examples you add, the more
            useful the AI will be.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            3. Configure AI Instructions
          </h2>
          <p className="text-muted-foreground">
            Visit the AI Instructions tab to provide any additional instructions
            to help the AI generate SQL code that you like.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Use the Editor</h2>
          <p className="text-muted-foreground">
            In the Editor tab, you can write SQL queries with AI assistance:
          </p>
          <ul className="mt-2 list-disc pl-6 text-muted-foreground">
            <li>
              Highlight SQL code and press <code>Cmd+K</code> to give the AI
              instructions to modify the selected SQL.
            </li>
            <li>
              Press <code>Cmd+L</code> to start an AI chat in the sidebar.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
