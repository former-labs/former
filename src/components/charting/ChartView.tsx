import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Loading } from "@/components/utils/Loading";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  type ColumnDefinition,
  type ColumnDefinitions,
  type DataRow,
  type ViewData,
} from "./chartTypes";
import { ViewContent } from "./ViewContent";
import { EditViewDialog, NewViewDialog } from "./ViewForm";

export const ChartView = ({
  viewData,
  setViewData,
  columnDefinitions,
  data,
  isLoading,
  editMode,
}: {
  viewData: ViewData | null;
  setViewData: (view: ViewData | null) => void;
  columnDefinitions: ColumnDefinitions | null;
  data: DataRow[] | null;
  isLoading: boolean;
  editMode: boolean;
}) => {
  const [showNewView, setShowNewView] = useState(false);
  const [showEditView, setShowEditView] = useState(false);
  const [editingView, setEditingView] = useState<ViewData | null>(null);

  if (data && columnDefinitions === null) {
    throw new Error("Data provided without column definitions");
  }

  if (!viewData || !data || !columnDefinitions) {
    return (
      <div className="flex h-48 items-center justify-center">
        {isLoading ? (
          <Loading />
        ) : (
          <Dialog open={showNewView} onOpenChange={setShowNewView}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewView(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Visualization
            </Button>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="h-[500px]">
        <ViewContent
          view={viewData}
          data={data}
          columnDefinitions={columnDefinitions}
          onEdit={() => {
            setEditingView(viewData);
            setShowEditView(true);
          }}
          onDelete={() => setViewData(null)}
          editMode={editMode}
        />
      </div>

      {editMode && (
        <NewViewDialog
          open={showNewView}
          onOpenChange={setShowNewView}
          columnDefinitions={columnDefinitions}
          onCreateView={async (view: ViewData) => {
            setViewData(view);
            setShowNewView(false);
          }}
        />
      )}

      {editMode && (
        <EditViewDialog
          open={showEditView}
          onOpenChange={setShowEditView}
          view={editingView}
          columnDefinitions={columnDefinitions}
          onUpdateView={async (updatedView: ViewData) => {
            setViewData(updatedView);
            setShowEditView(false);
            setEditingView(null);
          }}
        />
      )}
    </>
  );
};

// NOTE: Hard to distinguish between number and date types etc through introspection
// TODO: Pass in columnDefinitions from something that knows this metadata,
// or have the data casted (e.g. to a Date object)
// Otherwise we might need to provide a way for users to specify data types
export const calculateColumnDefinitions = (
  rows: DataRow[],
): ColumnDefinitions => {
  const definitions: ColumnDefinitions = {};

  Object.entries(rows[0] ?? []).forEach(([key, value]) => {
    let type: ColumnDefinition["type"];

    if (typeof value === "number") {
      type = "number";
      // } else if (value instanceof Date || (typeof value === "string" && !isNaN(Date.parse(value)))) {
      //   type = "date";
    } else {
      type = "string";
    }

    definitions[key] = {
      type,
    };
  });

  return definitions;
};
