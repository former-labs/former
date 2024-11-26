import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  type ColumnDefinitions,
  type Metric,
  type ViewData,
} from "./chartTypes";

const LineChartViewForm = ({
  viewData,
  setViewData,
  columnDefinitions,
}: {
  viewData: any;
  setViewData: (data: any) => void;
  columnDefinitions: ColumnDefinitions;
}) => (
  <>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="xAxis" className="text-right">
        X Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.xAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              xAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select X axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="yAxis" className="text-right">
        Y Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.yAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              yAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select Y axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
);

const BarChartViewForm = ({
  viewData,
  setViewData,
  columnDefinitions,
}: {
  viewData: any;
  setViewData: (data: any) => void;
  columnDefinitions: ColumnDefinitions;
}) => (
  <>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="xAxis" className="text-right">
        X Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.xAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              xAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select X axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="yAxis" className="text-right">
        Y Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.yAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              yAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select Y axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
);

const BoxPlotViewForm = ({
  viewData,
  setViewData,
  columnDefinitions,
}: {
  viewData: any;
  setViewData: (data: any) => void;
  columnDefinitions: ColumnDefinitions;
}) => (
  <>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="x" className="text-right">
        X Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.x}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              x: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select X axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="y" className="text-right">
        Y Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.y}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              y: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select Y axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
);

const ScatterChartViewForm = ({
  viewData,
  setViewData,
  columnDefinitions,
}: {
  viewData: any;
  setViewData: (data: any) => void;
  columnDefinitions: ColumnDefinitions;
}) => (
  <>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="xAxis" className="text-right">
        X Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.xAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              xAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select X axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="yAxis" className="text-right">
        Y Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.yAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              yAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select Y axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
);

const PieChartViewForm = ({
  viewData,
  setViewData,
  columnDefinitions,
}: {
  viewData: any;
  setViewData: (data: any) => void;
  columnDefinitions: ColumnDefinitions;
}) => (
  <>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="labels" className="text-right">
        Labels
      </Label>
      <Select
        value={viewData.viewTypeMetadata.labels}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              labels: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select labels" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="values" className="text-right">
        Values
      </Label>
      <Select
        value={viewData.viewTypeMetadata.values}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              values: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select values" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
);

const ClusteredChartViewForm = ({
  viewData,
  setViewData,
  columnDefinitions,
}: {
  viewData: any;
  setViewData: (data: any) => void;
  columnDefinitions: ColumnDefinitions;
}) => (
  <>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="xAxis" className="text-right">
        X Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.xAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              xAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select X axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="yAxis" className="text-right">
        Y Axis
      </Label>
      <Select
        value={viewData.viewTypeMetadata.yAxis}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              yAxis: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select Y axis" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="groupBy" className="text-right">
        Group By
      </Label>
      <Select
        value={viewData.viewTypeMetadata.groupBy}
        onValueChange={(value) =>
          setViewData({
            ...viewData,
            viewTypeMetadata: {
              ...viewData.viewTypeMetadata,
              groupBy: value,
            },
          })
        }
      >
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select Group By" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(columnDefinitions).map((key) => (
            <SelectItem key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
);

const ViewForm = ({
  initialData,
  columnDefinitions,
  onSubmit,
  submitLabel,
}: {
  initialData?: ViewData;
  columnDefinitions: ColumnDefinitions;
  onSubmit: (view: ViewData) => Promise<void>;
  submitLabel: string;
}) => {
  const [viewData, setViewData] = useState<ViewData>(
    initialData ?? {
      id: uuidv4(),
      name: "",
      description: "",
      viewType: "lineChart",
      viewTypeMetadata: {
        xAxis: Object.keys(columnDefinitions)[0]!,
        yAxis: Object.keys(columnDefinitions)[1]!,
      },
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleViewTypeChange = (type: ViewData["viewType"]) => {
    const firstMetric: Metric = Object.keys(columnDefinitions)[0]!;
    const secondMetric: Metric = Object.keys(columnDefinitions)[1]!;
    const thirdMetric: Metric = Object.keys(columnDefinitions)[2]!;

    let newView: ViewData;
    switch (type) {
      case "lineChart":
        newView = {
          ...viewData,
          viewType: "lineChart",
          viewTypeMetadata: {
            xAxis: firstMetric,
            yAxis: secondMetric,
          },
        };
        break;
      case "scatterChart":
        newView = {
          ...viewData,
          viewType: "scatterChart",
          viewTypeMetadata: {
            xAxis: firstMetric,
            yAxis: secondMetric,
          },
        };
        break;
      case "pieChart":
        newView = {
          ...viewData,
          viewType: "pieChart",
          viewTypeMetadata: {
            labels: firstMetric,
            values: secondMetric,
          },
        };
        break;
      case "barChart":
        newView = {
          ...viewData,
          viewType: "barChart",
          viewTypeMetadata: {
            xAxis: firstMetric,
            yAxis: secondMetric,
          },
        };
        break;
      case "boxPlot":
        newView = {
          ...viewData,
          viewType: "boxPlot",
          viewTypeMetadata: {
            x: firstMetric,
            y: secondMetric,
          },
        };
        break;
      case "clusteredChart":
        newView = {
          ...viewData,
          viewType: "clusteredChart",
          viewTypeMetadata: {
            xAxis: firstMetric,
            yAxis: secondMetric,
            groupBy: thirdMetric,
          },
        };
        break;
      default:
        const _exhaustiveCheck: never = type;
        return;
    }
    setViewData(newView);
  };

  return (
    <>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={viewData.name}
            onChange={(e) => setViewData({ ...viewData, name: e.target.value })}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input
            id="description"
            value={viewData.description}
            onChange={(e) =>
              setViewData({ ...viewData, description: e.target.value })
            }
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">
            Type
          </Label>
          <Select
            value={viewData.viewType}
            onValueChange={handleViewTypeChange}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lineChart">Line Chart</SelectItem>
              <SelectItem value="scatterChart">Scatter Chart</SelectItem>
              <SelectItem value="pieChart">Pie Chart</SelectItem>
              <SelectItem value="barChart">Bar Chart</SelectItem>
              <SelectItem value="boxPlot">Box Plot</SelectItem>
              <SelectItem value="clusteredChart">Clustered Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {viewData.viewType === "lineChart" && (
          <LineChartViewForm
            viewData={viewData}
            setViewData={setViewData}
            columnDefinitions={columnDefinitions}
          />
        )}

        {viewData.viewType === "scatterChart" && (
          <ScatterChartViewForm
            viewData={viewData}
            setViewData={setViewData}
            columnDefinitions={columnDefinitions}
          />
        )}

        {viewData.viewType === "pieChart" && (
          <PieChartViewForm
            viewData={viewData}
            setViewData={setViewData}
            columnDefinitions={columnDefinitions}
          />
        )}

        {viewData.viewType === "barChart" && (
          <BarChartViewForm
            viewData={viewData}
            setViewData={setViewData}
            columnDefinitions={columnDefinitions}
          />
        )}

        {viewData.viewType === "boxPlot" && (
          <BoxPlotViewForm
            viewData={viewData}
            setViewData={setViewData}
            columnDefinitions={columnDefinitions}
          />
        )}

        {viewData.viewType === "clusteredChart" && (
          <ClusteredChartViewForm
            viewData={viewData}
            setViewData={setViewData}
            columnDefinitions={columnDefinitions}
          />
        )}
      </div>
      <DialogFooter>
        <Button
          onClick={async () => {
            if (viewData.name) {
              setIsSubmitting(true);
              try {
                await onSubmit(viewData);
              } finally {
                setIsSubmitting(false);
              }
            }
          }}
          disabled={isSubmitting}
        >
          {submitLabel}
          {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </DialogFooter>
    </>
  );
};

export const NewViewDialog = ({
  open,
  onOpenChange,
  columnDefinitions,
  onCreateView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnDefinitions: ColumnDefinitions;
  onCreateView: (view: ViewData) => Promise<void>;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New View</DialogTitle>
          <DialogDescription>Configure a new chart view.</DialogDescription>
        </DialogHeader>
        <ViewForm
          columnDefinitions={columnDefinitions}
          onSubmit={onCreateView}
          submitLabel="Create View"
        />
      </DialogContent>
    </Dialog>
  );
};

export const EditViewDialog = ({
  open,
  onOpenChange,
  view,
  columnDefinitions,
  onUpdateView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: ViewData | null;
  columnDefinitions: ColumnDefinitions;
  onUpdateView: (view: ViewData) => Promise<void>;
}) => {
  if (!view) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit View</DialogTitle>
          <DialogDescription>Update your chart view.</DialogDescription>
        </DialogHeader>
        <ViewForm
          initialData={view}
          columnDefinitions={columnDefinitions}
          onSubmit={onUpdateView}
          submitLabel="Update View"
        />
      </DialogContent>
    </Dialog>
  );
};
