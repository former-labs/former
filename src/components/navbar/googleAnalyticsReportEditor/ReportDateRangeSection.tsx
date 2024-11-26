import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { z } from "zod";

const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
const daysAgoRegex = /^\d+daysAgo$/;
const reservedPrefixRegex = /^(date_range_|RESERVED_)/;

const googleAnalyticsDateSchema = z.union([
  z.literal("today"),
  z.literal("yesterday"),
  z.string().regex(daysAgoRegex),
  z.string().regex(dateFormatRegex),
]);

export const googleAnalyticsDateRangeSchema = z
  .object({
    startDate: googleAnalyticsDateSchema,
    endDate: googleAnalyticsDateSchema,
    name: z
      .string()
      .refine(
        (name) => !reservedPrefixRegex.test(name),
        "Name cannot begin with 'date_range_' or 'RESERVED_'",
      )
      .optional(),
  })
  .refine(
    (data) => {
      // Skip date comparison for relative dates
      if (
        typeof data.startDate !== "string" ||
        typeof data.endDate !== "string"
      ) {
        return true;
      }
      if (
        !dateFormatRegex.test(data.startDate) ||
        !dateFormatRegex.test(data.endDate)
      ) {
        return true;
      }
      return new Date(data.startDate) <= new Date(data.endDate);
    },
    {
      message: "Start date cannot be after end date",
      path: ["startDate"],
    },
  );

const formatDateValue = (value: string) => {
  if (value === "today") return "Today";
  if (value === "yesterday") return "Yesterday";

  const daysAgoMatch = /^(\d+)daysAgo$/.exec(value);
  if (daysAgoMatch) {
    return `${daysAgoMatch[1]} days ago`;
  }

  // Format YYYY-MM-DD as a readable date
  if (dateFormatRegex.test(value)) {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return value;
};

export const ReportDateRangesSection = ({
  dateRanges,
  onDateRangesChange,
}: {
  dateRanges: {
    startDate: string;
    endDate: string;
    name?: string;
  }[];
  onDateRangesChange: (
    dateRanges: {
      startDate: string;
      endDate: string;
      name?: string;
    }[],
  ) => void;
}) => {
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false);

  const handleDateRangeChange = (newDateRange: {
    startDate: string;
    endDate: string;
    name?: string;
  }) => {
    const updatedDateRanges = [...dateRanges];
    if (updatedDateRanges[0]) {
      updatedDateRanges[0] = newDateRange;
    } else {
      updatedDateRanges.push(newDateRange);
    }
    onDateRangesChange(updatedDateRanges);
  };

  const handleOpenChangeDateRangeDialog = () => {
    setIsDateRangeDialogOpen(true);
  };

  const handleRemoveDateRange = (index: number) => {
    const updatedDateRanges = [...dateRanges];
    updatedDateRanges.splice(index, 1);
    onDateRangesChange(updatedDateRanges);
  };

  return (
    <>
      <div>
        <h3 className="mb-2 font-bold text-gray-900">Date Range</h3>
        <ul className="space-y-2">
          {dateRanges.map((range, i) => (
            <Card key={i}>
              <li className="flex items-center space-x-2 p-4">
                <div className="flex-1">
                  <div className="flex flex-col gap-1">
                    {range.name && (
                      <span className="text-sm font-medium text-gray-700">
                        {range.name}
                      </span>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">From:</span>
                        <span className="text-sm">
                          {formatDateValue(range.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">To:</span>
                        <span className="text-sm">
                          {formatDateValue(range.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenChangeDateRangeDialog}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveDateRange(i)}
                >
                  Remove
                </Button>
              </li>
            </Card>
          ))}
        </ul>
        {dateRanges.length === 0 && (
          <Button
            onClick={handleOpenChangeDateRangeDialog}
            className="mt-4"
            size="sm"
            variant="outline"
          >
            Add Date Range
          </Button>
        )}
      </div>

      <SelectReportDateRangeDialog
        open={isDateRangeDialogOpen}
        onOpenChange={setIsDateRangeDialogOpen}
        dateRange={dateRanges[0] ?? null}
        onDateRangeChange={handleDateRangeChange}
      />
    </>
  );
};

const SelectReportDateRangeDialog = ({
  open,
  onOpenChange,
  dateRange,
  onDateRangeChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateRange: { startDate: string; endDate: string; name?: string } | null;
  onDateRangeChange: (dateRange: {
    startDate: string;
    endDate: string;
    name?: string;
  }) => void;
}) => {
  const [localDateRange, setLocalDateRange] = useState(
    dateRange ?? {
      startDate: "today",
      endDate: "7daysAgo",
    },
  );

  // Reset local state when dialog opens
  useEffect(() => {
    if (open) {
      setLocalDateRange(
        dateRange ?? {
          startDate: "today",
          endDate: "7daysAgo",
        },
      );
    }
  }, [open, dateRange]);

  const handleStartDateChange = (value: string) => {
    setLocalDateRange({ ...localDateRange, startDate: value });
  };

  const handleEndDateChange = (value: string) => {
    setLocalDateRange({ ...localDateRange, endDate: value });
  };

  const handleSave = () => {
    onDateRangeChange(localDateRange);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Date Range</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6 p-6">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name (optional):</label>
            <Input
              type="text"
              placeholder="Enter a name for this date range"
              value={localDateRange.name ?? ""}
              onChange={(e) =>
                setLocalDateRange({
                  ...localDateRange,
                  name: e.target.value || undefined,
                })
              }
            />
          </div>

          <DateSelector
            label="Start Date:"
            value={localDateRange.startDate}
            onChange={handleStartDateChange}
          />

          <DateSelector
            label="End Date:"
            value={localDateRange.endDate}
            onChange={handleEndDateChange}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DateSelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string, mode: "specific" | "relative") => void;
}) => {
  const mode = dateFormatRegex.test(value) ? "specific" : "relative";
  const daysAgoMatch = /^(\d+)daysAgo$/.exec(value);
  const daysAgo = daysAgoMatch?.[1] ?? "7";
  const daysAgoSelected = value.endsWith("daysAgo") || daysAgoMatch !== null;

  const handleModeChange = (newMode: "specific" | "relative") => {
    if (newMode === "specific") {
      // Convert to today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0]!;
      onChange(today, "specific");
    } else {
      onChange("today", "relative");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="min-w-[80px] text-sm font-medium">{label}</label>
        <Select
          value={mode}
          onValueChange={(value) =>
            handleModeChange(value as "specific" | "relative")
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="specific">Specific Date</SelectItem>
            <SelectItem value="relative">Relative Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pl-[96px]">
        {mode === "specific" ? (
          <DatePicker
            value={value ? new Date(value) : undefined}
            onChange={(date) =>
              onChange(date.toISOString().split("T")[0]!, "specific")
            }
          />
        ) : (
          <div className="flex gap-3">
            <Select
              value={
                value === "today"
                  ? "today"
                  : value === "yesterday"
                    ? "yesterday"
                    : "NdaysAgo"
              }
              onValueChange={(value) => {
                if (value === "NdaysAgo") {
                  onChange(`${daysAgo}daysAgo`, "relative");
                } else {
                  onChange(value, "relative");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="NdaysAgo">N days ago</SelectItem>
              </SelectContent>
            </Select>
            {daysAgoSelected && (
              <Input
                type="number"
                min="1"
                placeholder="Days ago"
                value={daysAgo}
                className="w-[120px]"
                onChange={(e) => {
                  if (e.target.value) {
                    onChange(`${e.target.value}daysAgo`, "relative");
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
