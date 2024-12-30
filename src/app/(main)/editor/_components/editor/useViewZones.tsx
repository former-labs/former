"use client";

import { type Monaco } from "@monaco-editor/react";
import { type editor } from "monaco-editor/esm/vs/editor/editor.api";
import type React from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useResizeObserver } from "usehooks-ts";

export type ViewZone = {
  id: string;
  lineNumber: number;
  domNode: HTMLDivElement;
  heightInPx?: number;
};

export const ViewZonePortal = ({
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

export const useViewZones = ({
  codeEditor,
  monaco,
}: {
  codeEditor: editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}): [
  ViewZone[],
  React.Dispatch<React.SetStateAction<ViewZone[]>>,
  (id: string, height: number) => void,
] => {
  const [viewZones, setViewZones] = useState<ViewZone[]>([]);
  const [zoneIdMapping, setZoneIdMapping] = useState<
    {
      uuid: string;
      zoneId: string;
    }[]
  >([]);

  const updateZoneHeight = (id: string, height: number) => {
    setViewZones((prev) =>
      prev.map((vz: ViewZone) =>
        vz.id === id ? { ...vz, heightInPx: height } : vz,
      ),
    );
  };

  useEffect(() => {
    if (!codeEditor || !monaco) return;

    // Store the active element before changing zones
    const activeElement = document.activeElement;

    // Remove existing view zones
    codeEditor.changeViewZones((changeAccessor) => {
      zoneIdMapping.forEach(({ zoneId }) => {
        changeAccessor.removeZone(zoneId);
      });
    });

    const newZoneIdMapping: {
      uuid: string;
      zoneId: string;
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

        const zoneId = changeAccessor.addZone({
          afterLineNumber: zone.lineNumber,
          heightInLines,
          domNode: zone.domNode,
        });

        newZoneIdMapping.push({
          uuid: zone.id,
          zoneId,
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
          zoneIdMapping.forEach(({ zoneId }) => {
            changeAccessor.removeZone(zoneId);
          });
        });
      }
    };
  }, [codeEditor, viewZones, monaco]);

  return [viewZones, setViewZones, updateZoneHeight];
};
