import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIntegrations } from "@/contexts/DataContext";
import { type Integration } from "@/types/connections";
import { EditIcon, Trash2 } from "lucide-react";

export function ExistingIntegrations({
  onEditIntegration,
}: {
  onEditIntegration: ({
    type,
    integration,
  }: {
    type: "bigquery" | "postgres";
    integration: Integration;
  }) => void;
}) {
  const { integrations, removeIntegration } = useIntegrations();

  const handleDelete = (id: string) => {
    removeIntegration(id);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-950">
          Connected Integrations
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          View and manage your connected data sources and integrations.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50/75">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="pl-6 text-xs font-medium text-zinc-500">
                Name
              </TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium text-zinc-500">
                Created At
              </TableHead>
              <TableHead className="pr-6 text-right text-xs font-medium text-zinc-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
              <TableRow
                key={integration.id}
                className="border-zinc-200 hover:bg-zinc-50"
              >
                <TableCell className="pl-6 text-sm font-medium text-zinc-900">
                  {integration.name}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {integration.type}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {new Date(integration.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                      // disabled={integration.demo}
                      onClick={() => {
                        if (
                          integration.type !== "bigquery" &&
                          integration.type !== "postgres"
                        ) {
                          throw new Error("Invalid integration type");
                        }

                        onEditIntegration({
                          type: integration.type,
                          integration,
                        });
                      }}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                      // disabled={integration.demo}
                      onClick={() => handleDelete(integration.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {integrations.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-sm text-zinc-500"
                >
                  No integrations connected yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
