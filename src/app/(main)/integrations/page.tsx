"use client";

import { BigQueryConnectModal } from "@/components/integrations/big-query-connect-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Power } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Define the IntegrationCardProps type
type IntegrationCardProps = {
  integration: {
    name: string;
    displayName: string;
    icon: string;
    connected: boolean;
    createdAt: string;
    description?: string; // Add this if description is used
  };
  onDisconnect?: (id: string) => void;
};

// Define a map for integration types based on schema
const integrationTypeMap: Record<
  string,
  {
    name: string;
    displayName: string;
    icon: string;
    description: string;
  }
> = {
  bigquery: {
    name: "BigQuery",
    displayName: "BigQuery",
    icon: "https://storage.googleapis.com/verve-assets/logos/bigquery.svg",
    description: "Connect your BigQuery account to start analyzing your data.",
  },
};

export default function IntegrationsPage() {
  const { activeRole } = useAuth();
  const workspaceId = activeRole?.workspaceId ?? "";

  const { toast } = useToast();
  const { data: integrations, refetch: refetchIntegrations } =
    api.integration.listIntegrations.useQuery(undefined, {
      enabled: !!workspaceId,
    });

  const deleteIntegrationMutation =
    api.integration.deleteIntegration.useMutation({
      onSuccess: () => {
        toast({
          title: "Integration deleted",
          description: "The integration has been removed successfully.",
        });
        void refetchIntegrations();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const handleDelete = (integrationId: string) => {
    deleteIntegrationMutation.mutate({ integrationId });
    void refetchIntegrations();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations?.map((integration) => {
          const integrationConfig = integrationTypeMap[integration.type];
          return (
            <IntegrationCard
              key={integration.id}
              integration={{
                name: integrationConfig?.name ?? integration.type,
                displayName: integrationConfig?.displayName ?? integration.type,
                icon: integrationConfig?.icon ?? "",
                connected: true,
                createdAt: integration.createdAt.toISOString(),
                description: integrationConfig?.description,
              }}
              onDisconnect={() => handleDelete(integration.id)}
            />
          );
        })}

        <AddIntegrationCard />
      </div>
    </div>
  );
}

const AddIntegrationCard = () => {
  const [openBigQueryModal, setOpenBigQueryModal] = useState(false);

  return (
    <>
      <Card
        className="flex cursor-pointer items-center justify-center p-6 transition-colors hover:bg-muted/50"
        onClick={() => setOpenBigQueryModal(true)}
        role="button"
        tabIndex={0}
      >
        <div className="flex max-w-xs flex-col items-center space-y-2">
          <div className="relative flex h-4 w-4 flex-col">
            <Image
              src="https://storage.googleapis.com/verve-assets/logos/bigquery.svg"
              alt="BigQuery logo"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm font-medium">Add BigQuery Integration</p>
        </div>
      </Card>

      <BigQueryConnectModal
        open={openBigQueryModal}
        onOpenChange={setOpenBigQueryModal}
      />
    </>
  );
};

const IntegrationCard = ({
  integration,
  onDisconnect,
}: IntegrationCardProps) => {
  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative h-10 w-10">
            <Image
              src={integration.icon}
              alt={`${integration.name} logo`}
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h3 className="font-medium">{integration.displayName}</h3>
            <Badge variant="secondary" className="text-xs">
              Connected{" "}
              {new Date(integration.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Badge>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => onDisconnect?.(integration.name)}
              >
                <Power className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disconnect</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p className="text-sm text-muted-foreground">{integration.description}</p>
    </Card>
  );
};
