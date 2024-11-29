"use client";

import { NewConversationSearchBar } from "@/components/chat/NewConversationSearchBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { Pencil, Plus, Settings } from "lucide-react";
import { use, useEffect, useState } from "react";
import { DashboardGridItemGoogleAnalytics } from "./DashboardGridItemGoogleAnalytics";
import {
  type DashboardGridItemType,
  type DashboardType,
} from "./dashboardTypes";
import { EditDashboardMetadataDialog } from "./EditDashboardMetadataDialog";
import { type GridItem, GridStackContainer } from "./GridStackContainer";

export default function Page({
  params,
}: {
  params: Promise<{ dashboardId: string }>;
}) {
  const { dashboardId } = use(params);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = api.dashboard.getDashboardDetails.useQuery({
    dashboardId,
  });

  if (dashboardLoading) {
    return <div>Loading...</div>;
  }

  if (dashboardError) {
    return <div>Error: {dashboardError.message}</div>;
  }

  if (!dashboard) {
    throw new Error("No Dashboard object?");
  }

  return <DashboardContent dashboard={dashboard} />;
}

const DashboardContent = ({ dashboard }: { dashboard: DashboardType }) => {
  const [editMode, setEditMode] = useState(false);
  const [localDashboard, setLocalDashboard] = useState(dashboard);
  const [editTitleDialogOpen, setEditTitleDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);

  /*
    If the dashboard is updated externally we probably want to replace local state?
    One case being the user goes to a chat and adds an item and then comes back to dashboard.
    This might have weird effects if the user is actively editing and someone else changes the 
    dashboard, but that seems like an unlikely edge case.
  */
  useEffect(() => {
    setLocalDashboard(dashboard);
  }, [dashboard]);

  const updateDashboardMutation = api.dashboard.updateDashboard.useMutation();

  const handleDelete = (localId: string) => {
    setLocalDashboard((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.localId !== localId),
    }));
  };

  const handleUpdateItem = (updatedItem: DashboardGridItemType) => {
    setLocalDashboard((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.localId === updatedItem.localId ? updatedItem : item,
      ),
    }));
  };

  const handleCancel = () => {
    setLocalDashboard(dashboard);
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      await updateDashboardMutation.mutateAsync({
        dashboardId: dashboard.id,
        dashboard: localDashboard,
      });
      setEditMode(false);
    } catch (error) {
      console.error("Failed to save dashboard:", error);
    }
  };

  const handleGridItemsChange = (updatedGridItems: GridItem[]) => {
    setLocalDashboard((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const updatedGridItem = updatedGridItems.find(
          (gridItem) => gridItem.id === item.localId,
        );
        if (!updatedGridItem) return item;

        return {
          ...item,
          dashboardItem: {
            gridX: updatedGridItem.x,
            gridY: updatedGridItem.y,
            gridWidth: updatedGridItem.w,
            gridHeight: updatedGridItem.h,
          },
        };
      }),
    }));
  };

  const gridItems: GridItem[] = localDashboard.items.map((item) => ({
    id: item.localId,
    x: item.dashboardItem.gridX,
    y: item.dashboardItem.gridY,
    w: item.dashboardItem.gridWidth,
    h: item.dashboardItem.gridHeight,
    content: (
      <DashboardGridItemGoogleAnalytics
        item={item}
        onDelete={() => handleDelete(item.localId)}
        onUpdateItem={handleUpdateItem}
        editMode={editMode}
      />
    ),
  }));

  return (
    <div>
      <div className="flex items-start justify-between p-10 pt-20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{localDashboard.title}</h1>
            {editMode && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setEditTitleDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {localDashboard.description ?? "No description"}
          </p>
        </div>
        <div className="flex gap-4">
          {!editMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setNewItemDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Item
            </Button>
          )}
          {!editMode ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Settings className="h-4 w-4" />
              Edit Dashboard
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={handleCancel}>
                Discard Changes
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                loading={updateDashboardMutation.isPending}
              >
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="min-h-[800px] w-full border bg-[#efefef] p-8">
        <GridStackContainer
          key={
            // Swap the key out to force it to remount
            editMode ? "grid-stack-container-edit" : "grid-stack-container-view"
          }
          items={gridItems}
          onItemsChange={handleGridItemsChange}
          options={{
            column: 20,
            margin: 5,
            ...(editMode
              ? {}
              : {
                  disableDrag: true,
                  disableResize: true,
                }),
          }}
        />
      </div>

      <EditDashboardMetadataDialog
        open={editTitleDialogOpen}
        onOpenChange={setEditTitleDialogOpen}
        currentTitle={localDashboard.title}
        currentDescription={localDashboard.description}
        onSave={(newTitle, newDescription) => {
          setLocalDashboard((prev) => ({
            ...prev,
            title: newTitle,
            description: newDescription,
          }));
        }}
      />

      <NewDashboardItemDialog
        open={newItemDialogOpen}
        onOpenChange={setNewItemDialogOpen}
      />
    </div>
  );
};

const NewDashboardItemDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add New Dashboard Item</DialogTitle>
          <DialogDescription>
            Ask a question about your analytics data to create a new
            visualization.
          </DialogDescription>
        </DialogHeader>

        <div>
          <NewConversationSearchBar />
        </div>
      </DialogContent>
    </Dialog>
  );
};
