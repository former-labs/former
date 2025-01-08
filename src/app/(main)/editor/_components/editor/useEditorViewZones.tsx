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
  needsRerender: boolean;
  // previousTop?: number;
};

/*
  This is unfortunately a bit confusing.
  It syncs the incoming viewZoneInstances with actual viewZones in Monaco reactively.
*/
export const useEditorViewZones = ({
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
            needsRerender: true,
          });
        }
      });

      return updatedZones;
    });
  }, [viewZoneInstances]);

  /*
    Clean up viewZones and any internal state tracking view zones when the editor changes.
  */
  useEffect(() => {
    return () => {
      if (codeEditor) {
        codeEditor.changeViewZones((changeAccessor) => {
          zoneIdMapping.forEach(({ editorZoneId }) => {
            changeAccessor.removeZone(editorZoneId);
          });
        });
      }
      setViewZones((prev) =>
        prev.map((zone) => ({
          ...zone,
          needsRerender: true,
        })),
      );
      setZoneIdMapping([]);
    };
  }, [codeEditor]);

  const updateZoneHeight = (id: string, height: number) => {
    setViewZones((prev) =>
      prev.map((vz: ViewZone) =>
        vz.id === id ? { ...vz, heightInPx: height, needsRerender: true } : vz,
      ),
    );
  };

  // Sync viewZones with Monaco editor
  useEffect(() => {
    if (!codeEditor || !monaco) return;

    // Store the active element before changing zones
    const activeElement = document.activeElement;

    const newZoneIdMapping: {
      id: string;
      editorZoneId: string;
    }[] = [];

    // Keep existing mappings for zones that don't need rerender
    zoneIdMapping.forEach((mapping) => {
      const zone = viewZones.find((z) => z.id === mapping.id);
      if (zone && !zone.needsRerender) {
        newZoneIdMapping.push(mapping);
      }
    });

    // Remove zones that no longer exist or need rerender
    codeEditor.changeViewZones((changeAccessor) => {
      zoneIdMapping.forEach(({ id, editorZoneId }) => {
        const zone = viewZones.find((z) => z.id === id);
        if (!zone || zone.needsRerender) {
          changeAccessor.removeZone(editorZoneId);
        }
      });
    });

    // Create new view zones for ones that need rerender
    codeEditor.changeViewZones((changeAccessor) => {
      viewZones.forEach((zone) => {
        if (zone.needsRerender) {
          const editorZoneId = changeAccessor.addZone({
            afterLineNumber: zone.lineNumber,
            heightInPx: zone.heightInPx,
            domNode: zone.domNode,
            // onDomNodeTop: (top) => {
            //   // Rerender if the zone has moved
            //   console.log("onDomNodeTop", top);
            //   if (zone.previousTop !== top) {
            //     setViewZones((prev) =>
            //       prev.map((vz) =>
            //         vz.id === zone.id
            //           ? { ...vz, needsRerender: true, previousTop: top }
            //           : vz,
            //       ),
            //     );
            //   }
            // },
          });

          newZoneIdMapping.push({
            id: zone.id,
            editorZoneId,
          });

          // Clear the needsRerender flag
          setViewZones((prev) =>
            prev.map((vz) =>
              vz.id === zone.id ? { ...vz, needsRerender: false } : vz,
            ),
          );
        }
      });

      // Restore focus after zones are updated
      if (activeElement instanceof HTMLElement) {
        requestAnimationFrame(() => {
          activeElement.focus();
        });
      }
    });

    setZoneIdMapping(newZoneIdMapping);

    // // Cleanup
    // return () => {
    //   if (codeEditor) {
    //     codeEditor.changeViewZones((changeAccessor) => {
    //       zoneIdMapping.forEach(({ editorZoneId }) => {
    //         changeAccessor.removeZone(editorZoneId);
    //       });
    //     });
    //   }
    // };
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
