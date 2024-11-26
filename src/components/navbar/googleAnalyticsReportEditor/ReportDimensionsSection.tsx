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

export const ReportDimensionsSection = ({
  dimensions,
  onDimensionsChange,
}: {
  dimensions: { name: string }[];
  onDimensionsChange: (dimensions: { name: string }[]) => void;
}) => {
  const [isDimensionDialogOpen, setIsDimensionDialogOpen] = useState(false);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState<
    number | null
  >(null);

  const handleDimensionSelect = (selectedDimensionName: string) => {
    if (currentDimensionIndex !== null) {
      const updatedDimensions = [...dimensions];
      updatedDimensions[currentDimensionIndex] = {
        name: selectedDimensionName,
      };
      onDimensionsChange(updatedDimensions);
    } else {
      onDimensionsChange([...dimensions, { name: selectedDimensionName }]);
    }
    setIsDimensionDialogOpen(false);
    setCurrentDimensionIndex(null);
  };

  const handleOpenChangeDimensionDialog = (index: number) => {
    setCurrentDimensionIndex(index);
    setIsDimensionDialogOpen(true);
  };

  const handleOpenAddDimensionDialog = () => {
    setCurrentDimensionIndex(null);
    setIsDimensionDialogOpen(true);
  };

  const handleRemoveDimension = ({ index }: { index: number }) => {
    const updatedDimensions = [...dimensions];
    updatedDimensions.splice(index, 1);
    onDimensionsChange(updatedDimensions);
  };

  return (
    <>
      <div>
        <h3 className="mb-2 font-bold text-gray-900">Dimensions</h3>
        <ul className="space-y-2">
          {dimensions.map((dimension, i) => (
            <Card key={i}>
              <li className="flex items-center space-x-2 p-4">
                <div className="flex-1">
                  {googleAnalyticsDefinitions.dimensions.find(
                    (d) => d.name === dimension.name,
                  )?.displayName || "Select dimension"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenChangeDimensionDialog(i)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveDimension({ index: i })}
                >
                  Remove
                </Button>
              </li>
            </Card>
          ))}
        </ul>
        <Button
          onClick={handleOpenAddDimensionDialog}
          className="mt-4"
          size="sm"
          variant="outline"
        >
          Add dimension
        </Button>
      </div>

      <SelectDimensionDialog
        open={isDimensionDialogOpen}
        onOpenChange={setIsDimensionDialogOpen}
        currentDimensionIndex={currentDimensionIndex}
        onDimensionSelect={handleDimensionSelect}
      />
    </>
  );
};

const SelectDimensionDialog = ({
  open,
  onOpenChange,
  currentDimensionIndex,
  onDimensionSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDimensionIndex: number | null;
  onDimensionSelect: (dimensionName: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVisibleDimensions = searchTerm
    ? googleAnalyticsDefinitions.dimensions.filter(
        (dimension) =>
          dimension.visible &&
          dimension.displayName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
    : googleAnalyticsDefinitions.dimensions.filter(
        (dimension) => dimension.visible,
      );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentDimensionIndex !== null
              ? "Change Dimension"
              : "Select Dimension"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <input
            type="text"
            placeholder="Search dimensions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-grow overflow-y-auto pb-16">
            <div className="grid max-h-[400px] gap-4">
              {filteredVisibleDimensions.map((dimension) => (
                <div key={dimension.name} className="rounded-lg border p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium">{dimension.displayName}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDimensionSelect(dimension.name)}
                    >
                      Select dimension
                    </Button>
                  </div>
                  {dimension.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {dimension.description}
                    </p>
                  )}
                </div>
              ))}
              {filteredVisibleDimensions.length === 0 && (
                <div className="mt-16 text-center text-gray-500">
                  No dimensions found.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
