"use client";

import { BigQueryConnectModal } from "@/app/(main)/integrations/_components/big-query-connect-modal";
import { ExistingIntegrations } from "@/app/(main)/integrations/_components/existing-integrations";
import { IntegrationCard } from "@/app/(main)/integrations/_components/integration-card";
import { PostgresConnectModal } from "@/app/(main)/integrations/_components/postgres-connect-modal";
import { SnowflakeConnectModal } from "@/app/(main)/integrations/_components/snowflake-connect-modal";
import BigQueryLogo from "@/components/assets/bigquery.svg";
import PostgresLogo from "@/components/assets/postgres.svg";
import SnowflakeLogo from "@/components/assets/snowflake.svg";
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
  {
    name: "Snowflake",
    icon: SnowflakeLogo,
    description:
      "Connect to your Snowflake data warehouse to analyze your data.",
    type: "snowflake" as const,
  },
];

export default function IntegrationsPage() {
  const [openBigQueryModal, setOpenBigQueryModal] = useState(false);
  const [openPostgresModal, setOpenPostgresModal] = useState(false);
  const [openSnowflakeModal, setOpenSnowflakeModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<
    Integration | undefined
  >(undefined);
  const { addIntegration, editIntegration } = useData();

  const handleCreateIntegration = (
    integration: Omit<Integration, "id" | "createdAt">,
  ) => {
    addIntegration(integration);
    handleCloseModal();
  };

  const handleUpdateIntegration = (
    id: string,
    integration: Omit<Integration, "id" | "createdAt">,
  ) => {
    editIntegration(id, integration);
    handleCloseModal();
  };

  const handleOpenModal = ({
    type,
    integration,
  }: {
    type: "bigquery" | "postgres" | "snowflake";
    integration?: Integration;
  }) => {
    setSelectedIntegration(integration);
    if (type === "bigquery") {
      setOpenBigQueryModal(true);
    } else if (type === "postgres") {
      setOpenPostgresModal(true);
    } else {
      setOpenSnowflakeModal(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedIntegration(undefined);
    setOpenBigQueryModal(false);
    setOpenPostgresModal(false);
    setOpenSnowflakeModal(false);
  };

  const handleModalSubmit = ({
    id,
    integration,
  }: {
    id: string | null;
    integration: Omit<Integration, "id" | "createdAt">;
  }) => {
    if (id) {
      handleUpdateIntegration(id, integration);
    } else {
      handleCreateIntegration(integration);
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
      <SnowflakeConnectModal
        open={openSnowflakeModal}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
        integration={selectedIntegration}
        onSubmit={(integration) => handleModalSubmit(integration)}
      />
    </div>
  );
}
