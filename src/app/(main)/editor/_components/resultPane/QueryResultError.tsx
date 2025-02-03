import { Button } from "@/components/ui/button";
import { useDatabaseMetadata } from "@/contexts/databaseMetadataStore";
import { api } from "@/trpc/react";
import { filterDatabaseMetadataContext } from "../chat/chatStore";
import { useActiveEditor } from "../editor/editorStore";

export const QueryResultError = ({ resultError }: { resultError: string }) => {
  const { databaseMetadata } = useDatabaseMetadata();
  const { data: knowledgeList = [] } = api.knowledge.listKnowledge.useQuery();
  const { data: instructions, isLoading: instructionsLoading } =
    api.instructions.getInstructions.useQuery();
  const { editorContent, setEditorContentDiff } = useActiveEditor();

  const inlineEditMutation = api.editor.inlineEdit.useMutation();

  const handleFixWithAI = async () => {
    if (!databaseMetadata || instructionsLoading) return;

    const response = await inlineEditMutation.mutateAsync({
      userMessage: `Fix this error I get when executing the SQL:\n${resultError}`,
      editorContent,
      editorSelection: {
        startLineNumber: 1,
        endLineNumber: editorContent.split("\n").length,
      },
      databaseMetadata: filterDatabaseMetadataContext(databaseMetadata),
      knowledge: knowledgeList,
      instructions: instructions ?? "",
    });

    setEditorContentDiff(response);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
      <div className="text-red-500">{resultError}</div>
      <Button onClick={handleFixWithAI} loading={inlineEditMutation.isPending}>
        Fix with AI
      </Button>
    </div>
  );
};
