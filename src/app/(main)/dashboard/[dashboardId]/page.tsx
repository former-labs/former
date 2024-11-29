"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { use, useState } from "react";
import { DashboardGridItemGoogleAnalytics } from "./DashboardGridItemGoogleAnalytics";
import {
  type DashboardGridItemType,
  type DashboardType,
} from "./dashboardTypes";
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
      <div className="flex items-center gap-4 p-8 pt-20">
        <h1 className="text-2xl font-bold">{dashboard.title}</h1>
        {!editMode ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditMode(true)}
          >
            Enter Edit Mode
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              loading={updateDashboardMutation.isPending}
            >
              Save
            </Button>
          </>
        )}
      </div>
      <div className="min-h-[800px] w-full border bg-[#d5d5d5]">
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
    </div>
  );
};
