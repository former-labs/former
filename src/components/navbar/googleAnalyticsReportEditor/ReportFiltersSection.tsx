import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  type GoogleAnalyticsReportFilter,
  type GoogleAnalyticsReportParameters,
} from "@/server/googleAnalytics/reportParametersSchema";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export const ReportFiltersSection = ({
  metrics,
  dimensions,
  metricFilter,
  dimensionFilter,
  onFilterChange,
}: {
  metrics: Array<{ name: string }>;
  dimensions: Array<{ name: string }>;
  metricFilter?: GoogleAnalyticsReportParameters["metricFilter"];
  dimensionFilter?: GoogleAnalyticsReportParameters["dimensionFilter"];
  onFilterChange: (params: {
    metricFilter?: GoogleAnalyticsReportParameters["metricFilter"];
    dimensionFilter?: GoogleAnalyticsReportParameters["dimensionFilter"];
  }) => void;
}) => {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<{
    filter: GoogleAnalyticsReportFilter;
    filterType: "metric" | "dimension";
    index: number;
  } | null>(null);

  // Store all filters in a flat array
  const [filters, setFilters] = useState<
    Array<{
      filterType: "metric" | "dimension";
      filter: GoogleAnalyticsReportFilter;
    }>
  >([]);

  // Initialize filters array from props
  useEffect(() => {
    const newFilters: Array<{
      filterType: "metric" | "dimension";
      filter: GoogleAnalyticsReportFilter;
    }> = [];

    if (metricFilter) {
      const metricFilters = metricFilter.filter
        ? [metricFilter.filter]
        : (metricFilter.andGroup?.expressions.map((expr) => expr.filter) ?? []);
      metricFilters.forEach((filter) => {
        newFilters.push({ filterType: "metric", filter });
      });
    }

    if (dimensionFilter) {
      const dimensionFilters = dimensionFilter.filter
        ? [dimensionFilter.filter]
        : (dimensionFilter.andGroup?.expressions.map((expr) => expr.filter) ??
          []);
      dimensionFilters.forEach((filter) => {
        newFilters.push({ filterType: "dimension", filter });
      });
    }

    setFilters(newFilters);
  }, [metricFilter, dimensionFilter]);

  // Convert flat array back to metric/dimension filters and call onFilterChange
  const handleFilterChange = (newFilters: typeof filters) => {
    const metricFilters = newFilters.filter((f) => f.filterType === "metric");
    const dimensionFilters = newFilters.filter(
      (f) => f.filterType === "dimension",
    );

    const newMetricFilter =
      metricFilters.length === 0
        ? undefined
        : metricFilters.length === 1
          ? { filter: metricFilters[0]!.filter }
          : {
              andGroup: {
                expressions: metricFilters.map((f) => ({ filter: f.filter })),
              },
            };

    const newDimensionFilter =
      dimensionFilters.length === 0
        ? undefined
        : dimensionFilters.length === 1
          ? { filter: dimensionFilters[0]!.filter }
          : {
              andGroup: {
                expressions: dimensionFilters.map((f) => ({
                  filter: f.filter,
                })),
              },
            };

    onFilterChange({
      metricFilter: newMetricFilter,
      dimensionFilter: newDimensionFilter,
    });
  };

  // Add a new filter
  const addFilter = ({
    filter,
    filterType,
  }: {
    filter: GoogleAnalyticsReportFilter;
    filterType: "metric" | "dimension";
  }) => {
    const newFilters = [...filters, { filter, filterType }];
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // Update an existing filter
  const updateFilter = ({
    filter,
    filterType,
    index,
  }: {
    filter: GoogleAnalyticsReportFilter;
    filterType: "metric" | "dimension";
    index: number;
  }) => {
    const newFilters = [...filters];
    newFilters[index] = { filter, filterType };
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // Remove a filter
  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
    handleFilterChange(newFilters);
  };

  // Helper to render filter details
  const renderFilterDetails = (filter: GoogleAnalyticsReportFilter) => {
    if (filter.stringFilter) {
      return (
        <div>
          <div className="text-sm text-gray-600">String Filter:</div>
          <div className="text-sm">
            {filter.fieldName}{" "}
            {filter.stringFilter.matchType.toLowerCase().replace("_", " ")}{" "}
            &ldquo;
            {filter.stringFilter.value}&rdquo;
            {filter.stringFilter.caseSensitive && " (case sensitive)"}
          </div>
        </div>
      );
    }

    if (filter.numericFilter) {
      return (
        <div>
          <div className="text-sm text-gray-600">Numeric Filter:</div>
          <div className="text-sm">
            {filter.fieldName}{" "}
            {filter.numericFilter.operation.toLowerCase().replace("_", " ")}{" "}
            {filter.numericFilter.value.doubleValue ??
              filter.numericFilter.value.intValue}
          </div>
        </div>
      );
    }

    if (filter.betweenFilter) {
      const from =
        filter.betweenFilter.fromValue.doubleValue ??
        filter.betweenFilter.fromValue.intValue;
      const to =
        filter.betweenFilter.toValue.doubleValue ??
        filter.betweenFilter.toValue.intValue;
      return (
        <div>
          <div className="text-sm text-gray-600">Between Filter:</div>
          <div className="text-sm">
            {filter.fieldName} between {from} and {to}
          </div>
        </div>
      );
    }

    if (filter.inListFilter) {
      return (
        <div>
          <div className="text-sm text-gray-600">In List Filter:</div>
          <div className="text-sm">
            {filter.fieldName} in [{filter.inListFilter.values.join(", ")}]
            {filter.inListFilter.caseSensitive && " (case sensitive)"}
          </div>
        </div>
      );
    }

    return null;
  };

  // Render all filters
  const renderFilters = () => {
    if (filters.length === 0) return null;

    return filters.map((filterItem, index) => (
      <Card key={index}>
        <div className="flex items-center space-x-2 p-4">
          <div className="flex-1">
            {filterItem.filterType === "metric" ? "Metric" : "Dimension"} Filter
            <div className="mt-2">{renderFilterDetails(filterItem.filter)}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingFilter({
                filter: filterItem.filter,
                filterType: filterItem.filterType,
                index,
              });
              setIsFilterDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeFilter(index)}
          >
            Remove
          </Button>
        </div>
      </Card>
    ));
  };

  return (
    <div>
      <h3 className="mb-2 font-bold text-gray-900">Filters</h3>
      <div className="space-y-2">
        {renderFilters()}
        {filters.length === 0 && (
          <div className="text-sm italic text-gray-500">No filters applied</div>
        )}
      </div>
      <Button
        onClick={() => {
          setEditingFilter(null);
          setIsFilterDialogOpen(true);
        }}
        className="mt-4"
        size="sm"
        variant="outline"
      >
        Add filter
      </Button>

      <FilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        metrics={metrics}
        dimensions={dimensions}
        onFilterAdd={
          editingFilter
            ? (params) => {
                updateFilter({ ...params, index: editingFilter.index });
                setEditingFilter(null);
              }
            : addFilter
        }
        initialFilter={editingFilter}
      />
    </div>
  );
};

const FilterDialog = ({
  open,
  onOpenChange,
  metrics,
  dimensions,
  onFilterAdd,
  initialFilter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: Array<{ name: string }>;
  dimensions: Array<{ name: string }>;
  onFilterAdd: ({
    filter,
    filterType,
  }: {
    filter: GoogleAnalyticsReportFilter;
    filterType: "metric" | "dimension";
  }) => void;
  initialFilter?: {
    filter: GoogleAnalyticsReportFilter;
    filterType: "metric" | "dimension";
    index: number;
  } | null;
}) => {
  const [filterType, setFilterType] = useState<"metric" | "dimension">(
    initialFilter?.filterType ?? "metric",
  );
  const [selectedField, setSelectedField] = useState(
    initialFilter?.filter.fieldName ?? "",
  );
  const [caseSensitive, setCaseSensitive] = useState(
    initialFilter?.filter.stringFilter?.caseSensitive ??
      initialFilter?.filter.inListFilter?.caseSensitive ??
      false,
  );

  const stringFilterOperations = [
    "EXACT",
    "BEGINS_WITH",
    "ENDS_WITH",
    "CONTAINS",
    "FULL_REGEXP",
    "PARTIAL_REGEXP",
  ] as const;

  const numericFilterOperations = [
    "EQUAL",
    "LESS_THAN",
    "LESS_THAN_OR_EQUAL",
    "GREATER_THAN",
    "GREATER_THAN_OR_EQUAL",
  ] as const;

  type StringFilterOperation = (typeof stringFilterOperations)[number];
  type NumericFilterOperation = (typeof numericFilterOperations)[number];
  type FilterOperation =
    | StringFilterOperation
    | NumericFilterOperation
    | "BETWEEN"
    | "IN_LIST"
    | undefined;

  const getInitialOperation = (): FilterOperation => {
    const filter = initialFilter?.filter;
    if (!filter) return undefined;

    if (filter.stringFilter) return filter.stringFilter.matchType;
    if (filter.numericFilter) return filter.numericFilter.operation;
    if (filter.betweenFilter) return "BETWEEN";
    if (filter.inListFilter) return "IN_LIST";
    return undefined;
  };

  const getInitialValue = (): string => {
    const filter = initialFilter?.filter;
    if (!filter) return "";

    if (filter.stringFilter) return filter.stringFilter.value;
    if (filter.numericFilter) {
      return (
        filter.numericFilter.value.doubleValue ??
        filter.numericFilter.value.intValue ??
        ""
      ).toString();
    }
    return "";
  };

  const [filterOperation, setFilterOperation] = useState<FilterOperation>(
    getInitialOperation(),
  );

  const [filterValue, setFilterValue] = useState(getInitialValue());
  const [fromValue, setFromValue] = useState(
    initialFilter?.filter.betweenFilter?.fromValue.doubleValue?.toString() ??
      initialFilter?.filter.betweenFilter?.fromValue.intValue?.toString() ??
      "",
  );
  const [toValue, setToValue] = useState(
    initialFilter?.filter.betweenFilter?.toValue.doubleValue?.toString() ??
      initialFilter?.filter.betweenFilter?.toValue.intValue?.toString() ??
      "",
  );
  const [listValues, setListValues] = useState<string[]>(
    initialFilter?.filter.inListFilter?.values ?? [""],
  );

  useEffect(() => {
    if (initialFilter) {
      setFilterType(initialFilter.filterType);
      setSelectedField(initialFilter.filter.fieldName || "");
      setCaseSensitive(
        initialFilter.filter.stringFilter?.caseSensitive ??
          initialFilter.filter.inListFilter?.caseSensitive ??
          false,
      );
      setFilterOperation(getInitialOperation());
      setFilterValue(getInitialValue());
      setFromValue(
        initialFilter.filter.betweenFilter?.fromValue.doubleValue?.toString() ??
          initialFilter.filter.betweenFilter?.fromValue.intValue?.toString() ??
          "",
      );
      setToValue(
        initialFilter.filter.betweenFilter?.toValue.doubleValue?.toString() ??
          initialFilter.filter.betweenFilter?.toValue.intValue?.toString() ??
          "",
      );
      setListValues(initialFilter.filter.inListFilter?.values ?? [""]);
    } else {
      setFilterType("metric");
      setSelectedField("");
      setCaseSensitive(false);
      setFilterOperation(undefined);
      setFilterValue("");
      setFromValue("");
      setToValue("");
      setListValues([""]);
    }
  }, [initialFilter]);

  const isNumericOperation = (
    op: FilterOperation,
  ): op is NumericFilterOperation => {
    return numericFilterOperations.includes(op as NumericFilterOperation);
  };

  const isStringOperation = (
    op: FilterOperation,
  ): op is StringFilterOperation => {
    return stringFilterOperations.includes(op as StringFilterOperation);
  };

  const handleSubmit = () => {
    if (!filterOperation) {
      return;
    }

    let filterDetails;
    if (isNumericOperation(filterOperation)) {
      filterDetails = {
        numericFilter: {
          operation: filterOperation,
          value: {
            doubleValue: parseFloat(filterValue),
            intValue: null,
          },
        },
      };
    } else if (isStringOperation(filterOperation)) {
      filterDetails = {
        stringFilter: {
          matchType: filterOperation,
          value: filterValue,
          caseSensitive,
        },
      };
    } else if (filterOperation === "IN_LIST") {
      filterDetails = {
        inListFilter: {
          values: listValues.filter((v) => v !== ""),
          caseSensitive,
        },
      };
    } else {
      filterDetails = {
        betweenFilter: {
          fromValue: {
            doubleValue: parseFloat(fromValue),
            intValue: null,
          },
          toValue: {
            doubleValue: parseFloat(toValue),
            intValue: null,
          },
        },
      };
    }

    const filter = {
      fieldName: selectedField,
      ...filterDetails,
    };

    onFilterAdd({ filter, filterType });
    onOpenChange(false);

    // Reset form
    setSelectedField("");
    setFilterOperation(undefined);
    setFilterValue("");
    setFromValue("");
    setToValue("");
    setCaseSensitive(false);
    setListValues([""]);
  };

  const fields = filterType === "metric" ? metrics : dimensions;

  const renderValueInput = () => {
    if (!filterOperation) return null;

    if (isStringOperation(filterOperation)) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">Value:</label>
          <Input
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter text value"
            type="text"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="caseSensitive"
              checked={caseSensitive}
              onCheckedChange={(checked) => setCaseSensitive(!!checked)}
            />
            <label
              htmlFor="caseSensitive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Case sensitive
            </label>
          </div>
        </div>
      );
    }

    if (isNumericOperation(filterOperation)) {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">Value:</label>
          <Input
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter numeric value"
            type="number"
          />
        </div>
      );
    }

    if (filterOperation === "BETWEEN") {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">Range:</label>
          <div className="flex items-center space-x-2">
            <Input
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              placeholder="From value"
              type="number"
            />
            <span>to</span>
            <Input
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              placeholder="To value"
              type="number"
            />
          </div>
        </div>
      );
    }

    if (filterOperation === "IN_LIST") {
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium">Values:</label>
          <div className="space-y-2">
            {listValues.map((value, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={value}
                  onChange={(e) => {
                    const newValues = [...listValues];
                    newValues[index] = e.target.value;
                    setListValues(newValues);
                  }}
                  placeholder="Enter value"
                  type="text"
                />
                <button
                  onClick={() => {
                    setListValues(listValues.filter((_, i) => i !== index));
                  }}
                  className="text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setListValues([...listValues, ""])}
              className="flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Value</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="caseSensitive"
              checked={caseSensitive}
              onCheckedChange={(checked) => setCaseSensitive(!!checked)}
            />
            <label
              htmlFor="caseSensitive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Case sensitive
            </label>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialFilter ? "Edit Filter" : "Add Filter"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter Type:</label>
            <Select
              value={filterType}
              onValueChange={(value) => {
                setFilterType(value as "metric" | "dimension");
                setSelectedField("");
                setFilterOperation(undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric Filter</SelectItem>
                <SelectItem value="dimension">Dimension Filter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Field:</label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.name} value={field.name}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Operation:</label>
            <Select
              value={filterOperation}
              onValueChange={(value) => {
                setFilterOperation(value as FilterOperation);
                setFilterValue("");
                setFromValue("");
                setToValue("");
                setListValues([""]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {filterType === "metric" ? (
                  <>
                    <SelectItem value="EQUAL">Equal (number)</SelectItem>
                    <SelectItem value="LESS_THAN">
                      Less than (number)
                    </SelectItem>
                    <SelectItem value="LESS_THAN_OR_EQUAL">
                      Less than or equal (number)
                    </SelectItem>
                    <SelectItem value="GREATER_THAN">
                      Greater than (number)
                    </SelectItem>
                    <SelectItem value="GREATER_THAN_OR_EQUAL">
                      Greater than or equal (number)
                    </SelectItem>
                    <SelectItem value="BETWEEN">Between (number)</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="EXACT">Exact match (text)</SelectItem>
                    <SelectItem value="BEGINS_WITH">
                      Begins with (text)
                    </SelectItem>
                    <SelectItem value="ENDS_WITH">Ends with (text)</SelectItem>
                    <SelectItem value="CONTAINS">Contains (text)</SelectItem>
                    <SelectItem value="FULL_REGEXP">
                      Full regexp (text)
                    </SelectItem>
                    <SelectItem value="PARTIAL_REGEXP">
                      Partial regexp (text)
                    </SelectItem>
                    <SelectItem value="IN_LIST">In list (text)</SelectItem>
                    <SelectItem value="EQUAL">Equal (number)</SelectItem>
                    <SelectItem value="LESS_THAN">
                      Less than (number)
                    </SelectItem>
                    <SelectItem value="LESS_THAN_OR_EQUAL">
                      Less than or equal (number)
                    </SelectItem>
                    <SelectItem value="GREATER_THAN">
                      Greater than (number)
                    </SelectItem>
                    <SelectItem value="GREATER_THAN_OR_EQUAL">
                      Greater than or equal (number)
                    </SelectItem>
                    <SelectItem value="BETWEEN">Between (number)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {renderValueInput()}

          <Button
            onClick={handleSubmit}
            disabled={
              !selectedField ||
              !filterOperation ||
              (filterOperation === "BETWEEN"
                ? !fromValue || !toValue
                : filterOperation === "IN_LIST"
                  ? listValues.length === 0 || listValues.every((v) => v === "")
                  : !filterValue)
            }
          >
            {initialFilter ? "Update Filter" : "Add Filter"}
          </Button>
        </div>
        <DialogDescription className="hidden">Filter dialog</DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
