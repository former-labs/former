"use client";

import { IntegrationSwitcher } from "@/app/(main)/integrations/_components/integration-switcher";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/contexts/DataContext";
import { api } from "@/trpc/react";
import { useState } from "react";

export default function AdminEvalPage() {
  const { activeCloudIntegration } = useData();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string>("");

  const evalMutation = api.eval.evalSql.useMutation({
    onSuccess: (data) => {
      setResult(JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      setResult(`Error: ${error.message}`);
    },
  });

  const handleEval = async () => {
    if (!activeCloudIntegration) {
      setResult("Please select an integration first");
      return;
    }

    void evalMutation.mutate({
      integrationId: activeCloudIntegration.id,
      query,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">SQL Eval</h1>
      </div>

      <div className="mb-4">
        <IntegrationSwitcher />
      </div>

      <Card className="p-4">
        <div className="mb-4">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter SQL query..."
            className="h-[200px]"
          />
        </div>

        <div className="mb-4">
          <Button onClick={handleEval} disabled={!activeCloudIntegration || !query}>
            Run Query
          </Button>
        </div>

        <div className="rounded bg-gray-100 p-4">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      </Card>
    </div>
  );
}
