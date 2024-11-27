import { GridStack, GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack-extra.min.css";
import "gridstack/dist/gridstack.min.css";
import { useEffect, useRef, useState } from "react";
import "./_styles/gridstack.css";

export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  content: React.ReactNode;
}

export const GridStackContainer = ({
  items,
  onItemsChange,
  options,
}: {
  items: GridItem[];
  onItemsChange: (items: GridItem[]) => void;
  options: GridStackOptions;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<GridStack | null>(null);
  const itemsRef = useRef<Record<string, HTMLElement>>({});

  // Initialize GridStack once
  useEffect(() => {
    if (gridRef.current && !grid) {
      const newGrid = GridStack.init(options, gridRef.current);
      setGrid(newGrid);
    }

    // return () => {
    //   // Cleanup on unmount
    //   grid?.destroy();
    // };
  }, [grid]);

  // Handle widget creation and removal
  useEffect(() => {
    if (!grid) return;

    // Add widgets that are not in the grid
    items.forEach((item) => {
      const el = itemsRef.current[item.id];
      if (el && !grid.engine.nodes.find((node) => node.el === el)) {
        grid.makeWidget(el);
      }
    });

    // Remove widgets that are no longer in items
    grid.engine.nodes.slice().forEach((node) => {
      const el = node.el;
      if (!el) return;
      const itemId = el.getAttribute("data-id");
      if (itemId && !items.find((item) => item.id === itemId)) {
        grid.removeWidget(el);
      }
    });
  }, [grid, items]);

  // Attach event handlers
  useEffect(() => {
    if (!grid) return;

    const handleDragStop = (event: any, element: any) => {
      const node = element.gridstackNode;
      const itemId = element.getAttribute("data-id");
      if (node && itemId) {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, x: node.x!, y: node.y! } : item,
        );
        onItemsChange(updatedItems);
      }
    };

    const handleResizeStop = (event: any, element: any) => {
      const node = element.gridstackNode;
      const itemId = element.getAttribute("data-id");
      if (node && itemId) {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, w: node.w!, h: node.h! } : item,
        );
        onItemsChange(updatedItems);
      }
    };

    // Attach event listeners
    grid.on("dragstop", handleDragStop);
    grid.on("resizestop", handleResizeStop);

    // Cleanup event listeners on unmount or grid change
    return () => {
      grid.off("dragstop");
      grid.off("resizestop");
    };
  }, [grid, items, onItemsChange]);

  const setItemRef = (id: string) => (el: HTMLElement | null) => {
    if (el) {
      itemsRef.current[id] = el;
    } else {
      delete itemsRef.current[id];
    }
  };

  return (
    <div ref={gridRef} className="grid-stack">
      {items.map((item) => (
        <div
          key={item.id}
          data-id={item.id}
          className="grid-stack-item"
          gs-x={item.x}
          gs-y={item.y}
          gs-w={item.w}
          gs-h={item.h}
          ref={setItemRef(item.id)}
        >
          <div className="grid-stack-item-content">{item.content}</div>
        </div>
      ))}
    </div>
  );
};
