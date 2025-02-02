"use client";

import { BigQueryConnectModal } from "@/app/(main)/integrations/_components/BigQueryConnectModal";
import { ExistingIntegrations } from "@/app/(main)/integrations/_components/existing-integrations";
import { IntegrationCard } from "@/app/(main)/integrations/_components/integration-card";
import { PostgresConnectModal } from "@/app/(main)/integrations/_components/postgres-connect-modal";
import BigQueryLogo from "@/components/assets/bigquery.svg";
import PostgresLogo from "@/components/assets/postgres.svg";
import { useData } from "@/contexts/DataContext";
import {
  DatabaseType,
  IntegrationToSave,
  type LocalIntegrationData,
} from "@/types/connections";
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
    LocalIntegrationData | undefined
  >(undefined);
  const { addLocalIntegration, editLocalIntegration } = useData();

  const handleCreateIntegration = (integrationToSave: IntegrationToSave) => {
    addLocalIntegration(integrationToSave);
    handleCloseModal();
  };

  const handleUpdateIntegration = ({
    id,
    integrationToSave,
  }: {
    id: string;
    integrationToSave: IntegrationToSave;
  }) => {
    editLocalIntegration(id, integrationToSave);
    handleCloseModal();
  };

  const handleOpenModal = ({
    type,
    integration,
  }: {
    type: DatabaseType;
    integration?: LocalIntegrationData;
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
    integrationToSave,
  }: {
    id: string | null;
    integrationToSave: IntegrationToSave;
  }) => {
    if (id) {
      handleUpdateIntegration({ id, integrationToSave });
    } else {
      handleCreateIntegration(integrationToSave);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-24">
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
        onSubmit={(integrationToSave) => handleModalSubmit(integrationToSave)}
      />
      <PostgresConnectModal
        open={openPostgresModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        integration={selectedIntegration}
        onSubmit={(integrationToSave) => handleModalSubmit(integrationToSave)}
      />
    </div>
  );
}
