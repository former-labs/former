import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
import { type GoogleAnalyticsReportParameters } from "@/server/googleAnalytics/reportParametersSchema";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";

export const ReportOrderBySection = ({
  metrics,
  dimensions,
  orderBys,
  onOrderByChange,
}: {
  metrics: { name: string }[];
  dimensions: { name: string }[];
  orderBys?: GoogleAnalyticsReportParameters["orderBys"];
  onOrderByChange: ({
    orderBys,
  }: {
    orderBys: GoogleAnalyticsReportParameters["orderBys"] | null;
  }) => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const orderByOptions = [
    ...metrics.map((metric) => ({
      type: "metric" as const,
      name: metric.name,
      displayName:
        googleAnalyticsDefinitions.metrics.find((m) => m.name === metric.name)
          ?.displayName ?? metric.name,
    })),
    ...dimensions.map((dimension) => ({
      type: "dimension" as const,
      name: dimension.name,
      displayName:
        googleAnalyticsDefinitions.dimensions.find(
          (d) => d.name === dimension.name,
        )?.displayName ?? dimension.name,
    })),
  ];

  const filteredOptions = searchTerm
    ? orderByOptions.filter((option) =>
        option.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : orderByOptions;

  const handleSelect = (option: (typeof orderByOptions)[0]) => {
    if (option.type === "metric") {
      onOrderByChange({
        orderBys: {
          metric: { metricName: option.name },
          dimension: null,
          desc: true,
        },
      });
    } else {
      onOrderByChange({
        orderBys: {
          metric: null,
          dimension: {
            dimensionName: option.name,
            orderType: "ALPHANUMERIC",
          },
          desc: true,
        },
      });
    }
    setIsDialogOpen(false);
  };

  const handleRemove = () => {
    onOrderByChange({ orderBys: null });
  };

  const handleToggleDirection = () => {
    if (!orderBys) return;
    onOrderByChange({
      orderBys: {
        ...orderBys,
        desc: !orderBys.desc,
      },
    });
  };

  const getCurrentOrderByDisplay = () => {
    if (!orderBys) return "None";

    let displayName = "None";
    if (orderBys.metric) {
      displayName =
        googleAnalyticsDefinitions.metrics.find(
          (m) => m.name === orderBys.metric?.metricName,
        )?.displayName ?? orderBys.metric.metricName;
    } else if (orderBys.dimension) {
      displayName =
        googleAnalyticsDefinitions.dimensions.find(
          (d) => d.name === orderBys.dimension?.dimensionName,
        )?.displayName ?? orderBys.dimension.dimensionName;
    }

    return `${displayName} (${orderBys.desc ? "descending" : "ascending"})`;
  };

  return (
    <>
      <div>
        <h3 className="mb-2 font-bold text-gray-900">Order By</h3>
        {orderBys ? (
          <Card>
            <div className="flex items-center space-x-2 p-4">
              <div className="flex-1">{getCurrentOrderByDisplay()}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleDirection}
                className="px-2"
              >
                {orderBys.desc ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : (
                  <ArrowUpIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="mt-4"
            size="sm"
            variant="outline"
          >
            Add order by
          </Button>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Order By</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 p-4">
            <input
              type="text"
              placeholder="Search metrics/dimensions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-grow overflow-y-auto pb-16">
              <div className="grid max-h-[400px] gap-4">
                {filteredOptions.map((option) => (
                  <div key={option.name} className="rounded-lg border p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-medium">{option.displayName}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelect(option)}
                      >
                        Select
                      </Button>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Type: {option.type}
                    </p>
                  </div>
                ))}
                {filteredOptions.length === 0 && (
                  <div className="text-center text-gray-500">
                    No options found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
