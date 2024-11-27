"use client";

import { api } from "@/trpc/react";
import { use, useState } from "react";
import { type GridItem, GridStackContainer } from "./GridStackContainer";

export default function Page({
  params,
}: {
  params: Promise<{ dashboardId: string }>;
}) {
  const { dashboardId } = use(params);

  const [editMode, setEditMode] = useState(false);

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

  console.log("Dashboard details:", dashboard);

  const gridItems: GridItem[] = dashboard.items.map((item) => ({
    id: item.localId,
    x: item.dashboardItem.gridX,
    y: item.dashboardItem.gridY,
    w: item.dashboardItem.gridWidth,
    h: item.dashboardItem.gridHeight,
    content: (
      <div>GRID ITEM HERE</div>
      // <DashboardGridItem
      //   item={item}
      //   onDelete={() => handleDelete(item.localId)}
      //   onUpdateItem={handleUpdateItem}
      //   editMode={editMode}
      // />
    ),
  }));

  return (
    <div>
      <div>Dashboard ID: {dashboardId}</div>
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
}
