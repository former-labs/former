"use client";

import BigQueryLogo from "@/components/assets/bigquery.svg";
import PostgresLogo from "@/components/assets/postgres.svg";
import { BigQueryConnectModal } from "@/components/integrations/big-query-connect-modal";
import { ExistingIntegrations } from "@/components/integrations/existing-integrations";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { PostgresConnectModal } from "@/components/integrations/postgres-connect-modal";
import { useData } from "@/contexts/DataContext";
import { useState } from "react";

const integrationTypes = [
  {
    name: "BigQuery",
    icon: BigQueryLogo,
    description: "Connect your BigQuery account to start analyzing your data.",
    type: "bigquery" as const,
  },
  {
    name: "Postgres",
    icon: PostgresLogo,
    description: "Connect to your Postgres database to analyze your data.",
    type: "postgres" as const,
  },
];

export default function IntegrationsPage() {
  const [openBigQueryModal, setOpenBigQueryModal] = useState(false);
  const [openPostgresModal, setOpenPostgresModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<{
    id?: string;
    type: "bigquery" | "postgres";
    name?: string;
    credentials?: any;
  } | null>(null);
  const { addIntegration, editIntegration } = useData();

  const getDefaultIntegrationName = (type: "bigquery" | "postgres", credentials: any) => {
    if (type === "bigquery") {
      return credentials.projectId;
    } else {
      return `${credentials.user}@${credentials.database}`;
    }
  };

  const handleCreateIntegration = (type: "bigquery" | "postgres", credentials: any) => {
    const defaultName = getDefaultIntegrationName(type, credentials);
    addIntegration({
      type,
      name: defaultName,
      credentials,
    });
    handleCloseModal();
  };

  const handleUpdateIntegration = (type: "bigquery" | "postgres", id: string, credentials: any) => {
    const defaultName = getDefaultIntegrationName(type, credentials);
    editIntegration(id, {
      name: defaultName,
      credentials,
    });
    handleCloseModal();
  };

  const handleNewIntegration = (type: "bigquery" | "postgres") => {
    setSelectedIntegration({ type });
    if (type === "bigquery") {
      setOpenBigQueryModal(true);
    } else {
      setOpenPostgresModal(true);
    }
  };

  const handleEditIntegration = (type: "bigquery" | "postgres", id: string, name: string, credentials: any) => {
    setSelectedIntegration({ type, id, name, credentials });
    if (type === "bigquery") {
      setOpenBigQueryModal(true);
    } else {
      setOpenPostgresModal(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedIntegration(null);
    setOpenBigQueryModal(false);
    setOpenPostgresModal(false);
  };

  const handleModalSubmit = (type: "bigquery" | "postgres", credentials: any) => {
    if (selectedIntegration?.id) {
      handleUpdateIntegration(type, selectedIntegration.id, credentials);
    } else {
      handleCreateIntegration(type, credentials);
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto px-6 py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[22px] font-semibold leading-7 mb-1">Integrations</h1>
          <p className="text-[14px] text-muted-foreground">
            Connect your data sources and manage existing connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationTypes.map((integration) => (
            <IntegrationCard
              key={integration.name}
              name={integration.name}
              description={integration.description}
              icon={integration.icon}
              onClick={() => handleNewIntegration(integration.type)}
            />
          ))}
        </div>

        <div className="mt-8">
          <ExistingIntegrations onEditIntegration={handleEditIntegration} />
        </div>
      </div>

      <BigQueryConnectModal
        open={openBigQueryModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        defaultValues={selectedIntegration?.credentials}
        mode={selectedIntegration?.id ? 'edit' : 'create'}
        integrationId={selectedIntegration?.id}
        integrationName={selectedIntegration?.name}
        onSubmit={(credentials) => handleModalSubmit('bigquery', credentials)}
      />
      <PostgresConnectModal
        open={openPostgresModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        defaultValues={selectedIntegration?.credentials}
        mode={selectedIntegration?.id ? 'edit' : 'create'}
        integrationId={selectedIntegration?.id}
        integrationName={selectedIntegration?.name}
        onSubmit={(credentials) => handleModalSubmit('postgres', credentials)}
      />
    </div>
  );
}
