"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { use, useState } from "react";
import { DashboardGridItemGoogleAnalytics } from "./DashboardGridItemGoogleAnalytics";
import { DashboardGridItemType, type DashboardType } from "./dashboardTypes";
import { GridItem, GridStackContainer } from "./GridStackContainer";

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
      <div className="mb-4 flex items-center gap-4">
        <div>Dashboard ID: {dashboard.id}</div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Exit Edit Mode" : "Enter Edit Mode"}
        </Button>
      </div>
      <div className="min-h-[800px] w-full border bg-[#d5d5d5]">
        <GridStackContainer
          key={
            editMode ? "grid-stack-container-edit" : "grid-stack-container-view"
          }
          items={gridItems}
          onItemsChange={() => {}}
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
