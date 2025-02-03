"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";

export function IntegrationSwitcher() {
  const {
    activeCloudIntegration: activeIntegration,
    setActiveCloudIntegration: setActiveIntegration,
    localIntegrations: integrations,
  } = useData();

  if (integrations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No integrations connected
      </div>
    );
  }

  return (
    <Select
      value={activeIntegration?.id ?? ""}
      onValueChange={(value) => {
        const integration = integrations.find((p) => p.id === value);
        setActiveIntegration(integration ?? null);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select integration">
          {activeIntegration?.type ?? "Select integration"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {integrations.map((integration) => (
          <SelectItem key={integration.id} value={integration.id}>
            {integration.type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
