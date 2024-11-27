import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
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
  editMode,
}: {
  viewData: ViewData | null;
  setViewData: (view: ViewData | null) => void;
  columnDefinitions: ColumnDefinitions;
  data: DataRow[];
  editMode: boolean;
}) => {
  const [showNewView, setShowNewView] = useState(false);
  const [showEditView, setShowEditView] = useState(false);
  const [editingView, setEditingView] = useState<ViewData | null>(null);

  return (
    <>
      <div className="h-[500px]">
        {!viewData ? (
          <div className="flex h-full items-center justify-center">
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
          </div>
        ) : (
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
        )}
      </div>

      {editMode && (
        <>
          <NewViewDialog
            open={showNewView}
            onOpenChange={setShowNewView}
            columnDefinitions={columnDefinitions}
            onCreateView={async (view: ViewData) => {
              setViewData(view);
              setShowNewView(false);
            }}
          />

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
        </>
      )}
    </>
  );
};
