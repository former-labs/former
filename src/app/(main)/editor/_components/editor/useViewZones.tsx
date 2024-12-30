"use client";

import { type Monaco } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useResizeObserver } from "usehooks-ts";

type ViewZone = {
  id: string;
  lineNumber: number;
  domNode: HTMLDivElement;
  heightInPx?: number;
};

/*
  This is unfortunately a bit confusing.
  It syncs the incoming viewZoneInstances with actual viewZones in Monaco reactively.
*/
export const useViewZones = ({
  viewZoneInstances,
  codeEditor,
  monaco,
}: {
  viewZoneInstances: {
    id: string;
    lineNumber: number;
  }[];
  codeEditor: editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}): {
  renderViewZone: (id: string, children: ReactNode) => ReactNode;
} => {
  const [viewZones, setViewZones] = useState<ViewZone[]>([]);
  const [zoneIdMapping, setZoneIdMapping] = useState<
    {
      id: string;
      editorZoneId: string;
    }[]
  >([]);

  // Sync viewZoneInstances with viewZones
  useEffect(() => {
    setViewZones((currentViewZones) => {
      // Keep existing zones that are still in instances
      const updatedZones = currentViewZones.filter((zone) =>
        viewZoneInstances.some((instance) => instance.id === zone.id),
      );

      // Add new zones
      viewZoneInstances.forEach((instance) => {
        if (!updatedZones.some((zone) => zone.id === instance.id)) {
          const domNode = document.createElement("div");
          domNode.style.position = "absolute";
          domNode.style.zIndex = "10";

          updatedZones.push({
            id: instance.id,
            lineNumber: instance.lineNumber,
            domNode,
          });
        }
      });

      return updatedZones;
    });
  }, [viewZoneInstances]);

  const updateZoneHeight = (id: string, height: number) => {
    setViewZones((prev) =>
      prev.map((vz: ViewZone) =>
        vz.id === id ? { ...vz, heightInPx: height } : vz,
      ),
    );
  };

  // Sync viewZones with Monaco editor
  useEffect(() => {
    if (!codeEditor || !monaco) return;

    // Store the active element before changing zones
    const activeElement = document.activeElement;

    // Remove existing view zones
    codeEditor.changeViewZones((changeAccessor) => {
      zoneIdMapping.forEach(({ editorZoneId }) => {
        changeAccessor.removeZone(editorZoneId);
      });
    });

    const newZoneIdMapping: {
      id: string;
      editorZoneId: string;
    }[] = [];

    // Create new view zones
    codeEditor.changeViewZones((changeAccessor) => {
      viewZones.forEach((zone) => {
        let heightInLines = 1;
        if (zone.heightInPx) {
          const lineHeight = codeEditor.getOption(
            monaco.editor.EditorOption.lineHeight,
          );
          heightInLines = Math.max(
            heightInLines,
            Math.ceil(zone.heightInPx / lineHeight),
          );
        }

        const editorZoneId = changeAccessor.addZone({
          afterLineNumber: zone.lineNumber,
          heightInLines,
          domNode: zone.domNode,
        });

        newZoneIdMapping.push({
          id: zone.id,
          editorZoneId,
        });
      });

      // Restore focus after zones are updated
      if (activeElement instanceof HTMLElement) {
        requestAnimationFrame(() => {
          activeElement.focus();
        });
      }
    });

    setZoneIdMapping(newZoneIdMapping);

    // Cleanup
    return () => {
      if (codeEditor) {
        codeEditor.changeViewZones((changeAccessor) => {
          zoneIdMapping.forEach(({ editorZoneId }) => {
            changeAccessor.removeZone(editorZoneId);
          });
        });
      }
    };
  }, [viewZones, codeEditor, monaco]);

  const renderViewZone = (id: string, children: ReactNode) => {
    const zone = viewZones.find((z) => z.id === id);
    if (!zone) return null;

    return (
      <ViewZonePortal
        key={zone.id}
        zone={zone}
        onHeightChange={updateZoneHeight}
      >
        {children}
      </ViewZonePortal>
    );
  };

  return {
    renderViewZone,
  };
};

const ViewZonePortal = ({
  zone,
  children,
  onHeightChange,
}: {
  zone: ViewZone;
  children: ReactNode;
  onHeightChange: (id: string, height: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Watch container height changes
  const { height = 0 } = useResizeObserver({
    ref: containerRef,
  });

  // Report height changes to parent
  useEffect(() => {
    if (height > 0) {
      onHeightChange(zone.id, height);
    }
  }, [height, zone.id]);

  return createPortal(
    <div className="h-full">
      <div ref={containerRef} className="h-fit">
        {children}
      </div>
    </div>,
    zone.domNode,
    zone.id,
  );
};
