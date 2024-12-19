"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import { EditIcon, FileSearch, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteKnowledgeDialog } from "./_components/DeleteKnowledgeDialog";
import { UpsertKnowledgeDialog } from "./_components/UpsertKnowledgeDialog";

export default function Page() {
  const { data: knowledge = [] } = api.knowledge.listKnowledge.useQuery();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletingKnowledgeId, setDeletingKnowledgeId] = useState<string | null>(
    null,
  );
  const [editingKnowledge, setEditingKnowledge] = useState<{
    id: string;
    name: string;
    description: string;
    query: string;
  } | null>(null);

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-24">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-[22px] font-semibold leading-7">
              AI Knowledge Base
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Snippets of text and example queries that you AI uses to generate
              more accurate SQL.
            </p>
          </div>
          <Button onClick={() => setOpenDialog(true)}>
            <FileSearch className="h-4 w-4" />
            Add Example Query
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-zinc-50/75">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="pl-6 text-xs font-medium text-zinc-500">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium text-zinc-500">
                  Description
                </TableHead>
                <TableHead className="text-xs font-medium text-zinc-500">
                  Query
                </TableHead>
                <TableHead className="pr-6 text-right text-xs font-medium text-zinc-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {knowledge.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-zinc-200 hover:bg-zinc-50"
                >
                  <TableCell className="pl-6 text-sm font-medium text-zinc-900">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {item.description}
                  </TableCell>
                  <TableCell className="mono max-w-md truncate text-sm text-zinc-500">
                    {item.query}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        onClick={() => {
                          setEditingKnowledge(item);
                          setOpenDialog(true);
                        }}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          setDeletingKnowledgeId(item.id);
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {knowledge.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-zinc-500"
                  >
                    No knowledge base queries created yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UpsertKnowledgeDialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) {
            setEditingKnowledge(null);
          }
        }}
        initialData={editingKnowledge ?? undefined}
      />
      <DeleteKnowledgeDialog
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        knowledgeId={deletingKnowledgeId}
      />
    </div>
  );
}
