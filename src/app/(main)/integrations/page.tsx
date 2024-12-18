"use client";

import BigQueryLogo from "@/components/assets/bigquery.svg";
import PostgresLogo from "@/components/assets/postgres.svg";
import { BigQueryConnectModal } from "@/components/integrations/big-query-connect-modal";
import { ExistingIntegrations } from "@/components/integrations/existing-integrations";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { PostgresConnectModal } from "@/components/integrations/postgres-connect-modal";
import { useData } from "@/contexts/DataContext";
import { type Integration } from "@/types/connections";
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
  const [selectedIntegration, setSelectedIntegration] = useState<
    Integration | undefined
  >(undefined);
  const { addIntegration, editIntegration } = useData();

  const handleCreateIntegration = (integration: Omit<Integration, "id">) => {
    addIntegration(integration);
    handleCloseModal();
  };

  const handleUpdateIntegration = (
    id: string,
    integration: Omit<Integration, "id">,
  ) => {
    editIntegration(id, integration);
    handleCloseModal();
  };

  const handleOpenModal = ({
    type,
    integration,
  }: {
    type: "bigquery" | "postgres";
    integration?: Integration;
  }) => {
    setSelectedIntegration(integration);
    if (type === "bigquery") {
      setOpenBigQueryModal(true);
    } else {
      setOpenPostgresModal(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedIntegration(undefined);
    setOpenBigQueryModal(false);
    setOpenPostgresModal(false);
  };

  const handleModalSubmit = ({
    id,
    integration,
  }: {
    id: string | null;
    integration: Omit<Integration, "id">;
  }) => {
    if (id) {
      handleUpdateIntegration(id, integration);
    } else {
      handleCreateIntegration(integration);
    }
  };

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="mb-1 text-[22px] font-semibold leading-7">
            Integrations
          </h1>
          <p className="text-[14px] text-muted-foreground">
            Connect your data sources and manage existing connections.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrationTypes.map((integration) => (
            <IntegrationCard
              key={integration.name}
              name={integration.name}
              description={integration.description}
              icon={integration.icon}
              onClick={() =>
                handleOpenModal({
                  type: integration.type,
                  integration: undefined,
                })
              }
            />
          ))}
        </div>

        <div className="mt-8">
          <ExistingIntegrations onEditIntegration={handleOpenModal} />
        </div>
      </div>

      <BigQueryConnectModal
        open={openBigQueryModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        integration={selectedIntegration}
        onSubmit={(integration) => handleModalSubmit(integration)}
      />
      <PostgresConnectModal
        open={openPostgresModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        integration={selectedIntegration}
        onSubmit={(integration) => handleModalSubmit(integration)}
      />
    </div>
  );
}
