"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";

export const DeleteKnowledgeDialog = ({
  open,
  onOpenChange,
  knowledgeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeId: string | null;
}) => {
  const utils = api.useUtils();
  const deleteKnowledge = api.knowledge.deleteKnowledge.useMutation({
    onSuccess: async () => {
      await utils.knowledge.listKnowledge.invalidate();
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    if (!knowledgeId) return;
    deleteKnowledge.mutate({ knowledgeId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Example Query</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this example query? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            loading={deleteKnowledge.isPending}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
