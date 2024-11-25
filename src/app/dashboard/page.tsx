"use client";

import { BarChart } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <BarChart className="h-12 w-12 text-gray-400" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Your analytics and reporting center</p>
      </div>
    </div>
  );
}
