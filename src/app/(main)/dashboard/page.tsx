"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PATH_DASHBOARD_SINGLE } from "@/lib/paths";
import { api } from "@/trpc/react";
import { BarChart } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: dashboards, error } = api.dashboard.listDashboards.useQuery();

  if (error) {
    return <div>Error loading dashboards: {error.message}</div>;
  }

  if (!dashboards) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-8">
      <div className="mb-8 flex flex-col items-center gap-4">
        <BarChart className="h-12 w-12 text-gray-400" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Your analytics and reporting center</p>
      </div>

      <div className="grid w-full max-w-4xl gap-4">
        {dashboards.map((dashboard) => (
          <Link
            key={dashboard.id}
            href={PATH_DASHBOARD_SINGLE(dashboard.id)}
            className="block transition-opacity hover:opacity-70"
          >
            <Card>
              <CardHeader>
                <CardTitle>{dashboard.title}</CardTitle>
                {dashboard.description && (
                  <CardDescription>{dashboard.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
