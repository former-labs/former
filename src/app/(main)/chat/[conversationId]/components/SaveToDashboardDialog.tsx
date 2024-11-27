"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";

export const SaveToDashboardDialog = ({
  open,
  onOpenChange,
  messageId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
}) => {
  const { data: dashboards, error } = api.dashboard.listDashboards.useQuery();
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setSelectedDashboardId(null);
    }
  }, [open]);

  const saveMessageToDashboardMutation =
    api.conversation.saveMessageToDashboard.useMutation({
      onSuccess: () => {
        onOpenChange(false);
      },
    });

  if (error) {
    return <div>Error loading dashboards: {error.message}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Dashboard</DialogTitle>
          <DialogDescription>
            Save this report and visualization to your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {dashboards?.map((dashboard) => (
            <div
              key={dashboard.id}
              className={`cursor-pointer rounded border p-2 ${
                selectedDashboardId === dashboard.id ? "bg-blue-100" : ""
              }`}
              onClick={() => setSelectedDashboardId(dashboard.id)}
            >
              <div className="font-bold">{dashboard.title}</div>
              {dashboard.description && (
                <div className="text-sm text-gray-600">
                  {dashboard.description}
                </div>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedDashboardId) {
                saveMessageToDashboardMutation.mutate({
                  messageId: messageId,
                  dashboardId: selectedDashboardId,
                });
              }
            }}
            loading={saveMessageToDashboardMutation.isPending}
            disabled={!selectedDashboardId}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
