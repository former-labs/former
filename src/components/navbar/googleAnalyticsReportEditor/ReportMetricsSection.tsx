import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import googleAnalyticsDefinitions from "@/lib/googleAnalytics/googleAnalyticsDefinitions.json";
import { useState } from "react";

export const ReportMetricsSection = ({
  metrics,
  onMetricsChange,
}: {
  metrics: { name: string }[];
  onMetricsChange: (metrics: { name: string }[]) => void;
}) => {
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false);
  const [currentMetricIndex, setCurrentMetricIndex] = useState<number | null>(
    null,
  );

  const handleMetricSelect = (selectedMetricName: string) => {
    if (currentMetricIndex !== null) {
      const updatedMetrics = [...metrics];
      updatedMetrics[currentMetricIndex] = {
        name: selectedMetricName,
      };
      onMetricsChange(updatedMetrics);
    } else {
      onMetricsChange([...metrics, { name: selectedMetricName }]);
    }
    setIsMetricDialogOpen(false);
    setCurrentMetricIndex(null);
  };

  const handleOpenChangeMetricDialog = (index: number) => {
    setCurrentMetricIndex(index);
    setIsMetricDialogOpen(true);
  };

  const handleOpenAddMetricDialog = () => {
    setCurrentMetricIndex(null);
    setIsMetricDialogOpen(true);
  };

  const handleRemoveMetric = ({ index }: { index: number }) => {
    const updatedMetrics = [...metrics];
    updatedMetrics.splice(index, 1);
    onMetricsChange(updatedMetrics);
  };

  return (
    <>
      <div>
        <h3 className="mb-2 font-bold text-gray-900">Metrics</h3>
        <ul className="space-y-2">
          {metrics.map((metric, i) => (
            <Card key={i}>
              <li className="flex items-center space-x-2 p-4">
                <div className="flex-1">
                  {googleAnalyticsDefinitions.metrics.find(
                    (m) => m.name === metric.name,
                  )?.displayName ?? "Select metric"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChangeMetricDialog(i)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMetric({ index: i })}
                >
                  {/* <X className="h-4 w-4 text-red-500" /> */}
                  Remove
                </Button>
              </li>
            </Card>
          ))}
        </ul>
        <Button
          onClick={handleOpenAddMetricDialog}
          className="mt-4"
          size="sm"
          variant="outline"
        >
          Add metric
        </Button>
      </div>

      <SelectMetricDialog
        open={isMetricDialogOpen}
        onOpenChange={setIsMetricDialogOpen}
        currentMetricIndex={currentMetricIndex}
        onMetricSelect={handleMetricSelect}
      />
    </>
  );
};

const SelectMetricDialog = ({
  open,
  onOpenChange,
  currentMetricIndex,
  onMetricSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMetricIndex: number | null;
  onMetricSelect: (metricName: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVisibleMetrics = searchTerm
    ? googleAnalyticsDefinitions.metrics.filter(
        (metric) =>
          metric.visible &&
          metric.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : googleAnalyticsDefinitions.metrics.filter((metric) => metric.visible);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentMetricIndex !== null ? "Change Metric" : "Select Metric"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-grow overflow-y-auto pb-16">
            <div className="grid max-h-[400px] gap-4">
              {filteredVisibleMetrics.map((metric) => (
                <div key={metric.name} className="rounded-lg border p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium">{metric.displayName}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMetricSelect(metric.name)}
                    >
                      Select metric
                    </Button>
                  </div>
                  {metric.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {metric.description}
                    </p>
                  )}
                </div>
              ))}
              {filteredVisibleMetrics.length === 0 && (
                <div className="mt-16 text-center text-gray-500">
                  No metrics found.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
