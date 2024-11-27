"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PATH_DASHBOARD_SINGLE } from "@/lib/paths";
import { api } from "@/trpc/react";
import { BarChart, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

        <div className="flex justify-center">
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Dashboard
          </Button>
        </div>
      </div>

      <NewDashboardDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}

const NewDashboardDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const router = useRouter();
  const createDashboard = api.dashboard.createDashboard.useMutation({
    onSuccess: (data) => {
      router.push(PATH_DASHBOARD_SINGLE(data.dashboardId));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
          <DialogDescription>
            Create a new dashboard to store your GA4 reports.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              createDashboard.mutate();
            }}
            loading={createDashboard.isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
