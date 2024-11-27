"use client";

import { use } from "react";

export default function Page({
  params,
}: {
  params: Promise<{ dashboardId: string }>;
}) {
  const { dashboardId } = use(params);
  return <div>Dashboard ID: {dashboardId}</div>;
}
