"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const [instructions, setInstructions] = useState("");
  const utils = api.useUtils();

  const { data: existingInstructions, isLoading } =
    api.instructions.getInstructions.useQuery();

  useEffect(() => {
    if (existingInstructions) {
      setInstructions(existingInstructions);
    }
  }, [existingInstructions]);

  const saveInstructionsMutation = api.instructions.setInstructions.useMutation(
    {
      onSuccess: () => {
        void utils.instructions.getInstructions.invalidate();
      },
    },
  );

  const handleSave = () => {
    saveInstructionsMutation.mutate({ instructions });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasChanges = existingInstructions !== instructions;

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-24">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="mb-1 text-[22px] font-semibold leading-7">
              AI Instructions
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Use this to provide extra instructions and context to the AI. e.g.
              Style guides, domain knowledge, etc.
            </p>
          </div>
          <Button
            onClick={handleSave}
            loading={saveInstructionsMutation.isPending}
            disabled={!hasChanges || saveInstructionsMutation.isPending}
          >
            Save Changes
          </Button>
        </div>

        <Textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter instructions..."
          className="min-h-48 w-full border border-zinc-200 bg-white shadow-sm"
        />

        <details className="rounded-lg border">
          <summary className="cursor-pointer px-4 py-2 hover:bg-muted">
            Example Instructions
          </summary>
          <div className="border-t p-4">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
              {`SQL Style Guide
- Use uppercase for SQL keywords (SELECT, FROM, WHERE, etc)
- Always include table aliases in joins
- Add comments for complex queries

Other Notes
- customer_id is always a UUID
- status can only be 'active', 'pending', or 'cancelled'
- Soft deletes are handled via deleted_at column
- Always include WHERE deleted_at IS NULL unless explicitly querying deleted records
- Limit large result sets to 1000 rows by default`}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}
