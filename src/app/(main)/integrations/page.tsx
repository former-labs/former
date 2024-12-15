"use client";

import { BigQueryConnectModal } from "@/components/integrations/big-query-connect-modal";
import { PostgresConnectModal } from "@/components/integrations/postgres-connect-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useData } from "@/contexts/DataContext";
import { Power } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const integrationTypeMap = {
  bigquery: {
    name: "BigQuery",
    displayName: "BigQuery",
    icon: "https://storage.googleapis.com/verve-assets/logos/bigquery.svg",
    description: "Connect your BigQuery account to start analyzing your data.",
  },
  postgres: {
    name: "PostgreSQL",
    displayName: "PostgreSQL",
    icon: "https://storage.googleapis.com/verve-assets/logos/postgresql.svg",
    description: "Connect to your PostgreSQL database to analyze your data.",
  },
} as const;

export default function IntegrationsPage() {
  const { integrations, removeIntegration } = useData();
  const [openBigQueryModal, setOpenBigQueryModal] = useState(false);
  const [openPostgresModal, setOpenPostgresModal] = useState(false);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={{
              ...integration,
              ...integrationTypeMap[integration.type],
            }}
            onDisconnect={() => removeIntegration(integration.id)}
          />
        ))}

        <AddIntegrationCard
          onSelectBigQuery={() => setOpenBigQueryModal(true)}
          onSelectPostgres={() => setOpenPostgresModal(true)}
        />
      </div>

      <BigQueryConnectModal
        open={openBigQueryModal}
        onOpenChange={setOpenBigQueryModal}
      />
      <PostgresConnectModal
        open={openPostgresModal}
        onOpenChange={setOpenPostgresModal}
      />
    </div>
  );
}

const AddIntegrationCard = ({
  onSelectBigQuery,
  onSelectPostgres,
}: {
  onSelectBigQuery: () => void;
  onSelectPostgres: () => void;
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card
        className="flex cursor-pointer items-center justify-center p-6 transition-colors hover:bg-muted/50"
        onClick={onSelectBigQuery}
        role="button"
        tabIndex={0}
      >
        <div className="flex max-w-xs flex-col items-center space-y-2">
          <div className="relative flex h-8 w-8 flex-col">
            <Image
              src={integrationTypeMap.bigquery.icon}
              alt="BigQuery logo"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm font-medium">Add BigQuery Integration</p>
        </div>
      </Card>

      <Card
        className="flex cursor-pointer items-center justify-center p-6 transition-colors hover:bg-muted/50"
        onClick={onSelectPostgres}
        role="button"
        tabIndex={0}
      >
        <div className="flex max-w-xs flex-col items-center space-y-2">
          <div className="relative flex h-8 w-8 flex-col">
            <Image
              src={integrationTypeMap.postgres.icon}
              alt="PostgreSQL logo"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm font-medium">Add PostgreSQL Integration</p>
        </div>
      </Card>
    </div>
  );
};

const IntegrationCard = ({
  integration,
  onDisconnect,
}: {
  integration: {
    id: string;
    type: "bigquery" | "postgres";
    name: string;
    credentials: any;
    createdAt: string;
    displayName: string;
    icon: string;
    description: string;
  };
  onDisconnect: () => void;
}) => {
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
              <Button variant="destructive" size="icon" onClick={onDisconnect}>
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
