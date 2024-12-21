"use client";

import { type Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ViewZone = {
  id: string;
  lineNumber: number;
  domNode: HTMLDivElement;
  heightInPx?: number;
};

export const ViewZonePortal = ({
  zone,
  children,
}: {
  zone: ViewZone;
  children: ReactNode;
}) => {
  return createPortal(
    <div className="flex h-full flex-col justify-end pb-[1px]">{children}</div>,
    zone.domNode,
    zone.id,
  );
};

export const useViewZones = ({
  viewZones,
  codeEditor,
  monaco,
}: {
  viewZones: ViewZone[];
  codeEditor: editor.IStandaloneCodeEditor | null;
  monaco: Monaco | null;
}) => {
  const [zoneIdMapping, setZoneIdMapping] = useState<
    {
      uuid: string;
      zoneId: string;
    }[]
  >([]);

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
};
