import {
  type ColumnDefinitions,
  type DataRow,
  type ViewData,
} from "./chartTypes";
import { ViewContent } from "./ViewContent";

export const ChartView = ({
  viewData,
  columnDefinitions,
  data,
}: {
  viewData: ViewData | null;
  columnDefinitions: ColumnDefinitions;
  data: DataRow[];
}) => {
  if (!viewData) {
    return null;
  }

  return (
    <div className="h-full">
      <ViewContent
        view={viewData}
        data={data}
        columnDefinitions={columnDefinitions}
      />
    </div>
  );
};
