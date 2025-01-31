"use client";

import { useCallback, useMemo, useState, useEffect } from "react";

import { useCanvasContext } from "@/context/canvas-context";

import {
  Camera,
  CanvasMode,
  Color,
  Layer,
  LayerType,
  PencilDraftItem,
  Point,
  Side,
  XYWH,
} from "@/types/canvas";

import { Info } from "./info";
import { Toolbar } from "./toolbar";
import {
  colorToCss,
  connectionIdToColor,
  findIntersectingLayersWithRectangle,
  penPointsToPathLayer,
  pointerEventToCanvasPoint,
  resizeBounds,
} from "@/lib/utils";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { nanoid } from "nanoid";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useUnselectLayers } from "@/hooks/use-unselect-layers";

const MAX_LAYERS = 100;

interface CanvasProps {
  boardId: string;
}

export const Canvas = ({ boardId }: CanvasProps) => {
  const {
    cursor,
    pencilDraft,
    penColor,
    layerIds,
    selection,
    layers,
    canvasState,
    history,
  } = useCanvasContext();

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  useDisableScrollBounce();
  const unSelectLayers = useUnselectLayers();

  const insertLayer = useCallback(
    (
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note,
      position: Point,
    ) => {
      if (layers.value.size >= MAX_LAYERS) {
        return;
      }

      const layerId = nanoid();
      const layer = {
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor,
      } as Layer;

      layerIds.push(layerId);
      layers.update(layerId, layer);

      selection.update([layerId]);
      canvasState.update({ mode: CanvasMode.None });
      history.resume();
    },
    [layers.value, layerIds.value, lastUsedColor],
  );

  const translateSelectedLayers = useCallback(
    (point: Point) => {
      if (canvasState.value.mode !== CanvasMode.Translating) {
        return;
      }

      const offset = {
        x: point.x - canvasState.value.current.x,
        y: point.y - canvasState.value.current.y,
      };

      for (const id of selection.value) {
        const layer = layers.value.get(id);

        if (layer) {
          layer["x"] += offset.x;
          layer["y"] += offset.y;
          layers.update(id, layer);
        }
      }

      canvasState.update({ mode: CanvasMode.Translating, current: point });
    },
    [layers.value, selection.value, canvasState.value],
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      canvasState.update({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });
    }
  }, []);

  const updateSelectionNet = useCallback(
    (current: Point, origin: Point) => {
      canvasState.update({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      });

      const ids = findIntersectingLayersWithRectangle(
        layerIds.value,
        layers.value,
        origin,
        current,
      );

      selection.update(ids);
    },
    [layerIds.value, layers.value],
  );

  const continueDrawing = useCallback(
    (point: Point, e: React.PointerEvent) => {
      if (
        canvasState.value.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft.value == null
      ) {
        return;
      }

      cursor.update(point);

      pencilDraft.update(
        pencilDraft.value.length === 1 &&
          pencilDraft.value[0][0] === point.x &&
          pencilDraft.value[0][1] === point.y
          ? (pencilDraft.value as PencilDraftItem[])
          : ([
              ...pencilDraft.value,
              [point.x, point.y, e.pressure],
            ] as PencilDraftItem[]),
      );
    },
    [canvasState.value.mode, pencilDraft.value],
  );

  const insertPath = useCallback(() => {
    if (
      pencilDraft.value == null ||
      pencilDraft.value.length < 2 ||
      layers.value.size >= MAX_LAYERS
    ) {
      pencilDraft.update(null);
      return;
    }

    const id = nanoid();
    layers.update(id, penPointsToPathLayer(pencilDraft.value, lastUsedColor));

    layerIds.push(id);

    pencilDraft.update(null);
    canvasState.update({ mode: CanvasMode.Pencil });
  }, [pencilDraft.value, layers.value, lastUsedColor]);

  const startDrawing = useCallback(
    (point: Point, pressure: number) => {
      pencilDraft.update([[point.x, point.y, pressure]]);
      penColor.update(lastUsedColor);
    },
    [lastUsedColor],
  );

  const resizeSelectedLayer = useCallback(
    (point: Point) => {
      if (canvasState.value.mode !== CanvasMode.Resizing) {
        return;
      }

      const bounds = resizeBounds(
        canvasState.value.initialBounds,
        canvasState.value.corner,
        point,
      );

      if (selection.value.length > 0) {
        const layerId = selection.value[0];
        if (layers.value.has(layerId)) {
          const layer = layers.value.get(layerId)!;

          layer["x"] = bounds.x;
          layer["y"] = bounds.y;
          layer["width"] = bounds.width;
          layer["height"] = bounds.height;
          layers.update(layerId, layer);
        }
      }
    },
    [layers.value, selection.value, canvasState.value],
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      canvasState.update({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      });
    },
    [history.value],
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();

      const current = pointerEventToCanvasPoint(e, camera);

      if (canvasState.value.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.value.origin);
      } else if (canvasState.value.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.value.origin);
      } else if (canvasState.value.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.value.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.value.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }

      cursor.update(current);
    },
    [
      continueDrawing,
      camera,
      canvasState.value,
      cursor.value,
      resizeSelectedLayer,
      translateSelectedLayers,
      startMultiSelection,
      updateSelectionNet,
    ],
  );

  const onPointerLeave = useCallback(() => {
    cursor.update(null);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.value.mode === CanvasMode.Inserting ||
        canvasState.value.mode === CanvasMode.TextEditing
      ) {
        return;
      }

      if (canvasState.value.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      canvasState.update({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.value.mode, canvasState.update, startDrawing],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      history.resume();

      const point = pointerEventToCanvasPoint(e, camera);

      if (
        canvasState.value.mode == CanvasMode.None ||
        canvasState.value.mode == CanvasMode.Pressing
      ) {
        unSelectLayers();

        canvasState.update({
          mode: CanvasMode.None,
        });
      } else if (canvasState.value.mode == CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.value.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.value.layerType, point);
      } else {
        canvasState.update({
          mode: CanvasMode.None,
        });
      }
    },
    [
      canvasState.update,
      camera,
      canvasState.value,
      history.value,
      insertLayer,
      insertPath,
    ],
  );

  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.value.mode === CanvasMode.Pencil ||
        canvasState.value.mode === CanvasMode.Inserting ||
        canvasState.value.mode === CanvasMode.TextEditing
      ) {
        return;
      }

      history.pause();
      e.stopPropagation();

      const point = pointerEventToCanvasPoint(e, camera);

      if (!selection.value.includes(layerId)) {
        selection.update([layerId]);
        history.resume();
      }
      canvasState.update({ mode: CanvasMode.Translating, current: point });
    },
    [camera, history, canvasState.value.mode, selection.value],
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const selectionItem of selection.value) {
      for (const layerId of selectionItem) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(1);
      }
    }

    return layerIdsToColorSelection;
  }, [selection.value]);

  const deleteLayers = useDeleteLayers();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "Backspace":
          deleteLayers();
          break;
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              history.redo();
            } else {
              history.undo();
            }
          }
          break;
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteLayers, history]);

  return (
    <main className="h-screen w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Toolbar
        canvasState={canvasState.value}
        setCanvasState={canvasState.update}
        canUndo={history.canUndo()}
        canRedo={history.canRedo()}
        undo={history.undo}
        redo={history.redo}
      />
      <SelectionTools camera={camera} setLastUsedColor={setLastUsedColor} />
      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px`,
          }}
        >
          {layerIds.value.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              setCanvasState={canvasState.update}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
          {canvasState.value.mode === CanvasMode.SelectionNet &&
            canvasState.value.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                x={Math.min(
                  canvasState.value.origin.x,
                  canvasState.value.current.x,
                )}
                y={Math.min(
                  canvasState.value.origin.y,
                  canvasState.value.current.y,
                )}
                width={Math.abs(
                  canvasState.value.origin.x - canvasState.value.current.x,
                )}
                height={Math.abs(
                  canvasState.value.origin.y - canvasState.value.current.y,
                )}
              />
            )}
          {pencilDraft.value != null && pencilDraft.value.length > 0 && (
            <Path
              points={pencilDraft.value}
              fill={colorToCss(lastUsedColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>
    </main>
  );
};
