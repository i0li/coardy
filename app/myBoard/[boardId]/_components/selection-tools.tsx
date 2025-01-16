"use client";

import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";
import { Camera, Color } from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { memo, useCallback } from "react";
import { ColorPicker } from "./color-picker";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useCanvasContext } from "@/context/canvas-context";

interface SelectionToolsProps {
  camera: Camera;
  setLastUsedColor: (color: Color) => void;
}

export const SelectionTools = memo(
  ({ camera, setLastUsedColor, history }: SelectionToolsProps) => {
    const { selection, layerIds, layers } = useCanvasContext();

    const moveToFront = useCallback(() => {
      history.pause();

      const currentLayerIds = layerIds.value;
      const indices: number[] = [];

      for (let i = 0; i < currentLayerIds.length; i++) {
        if (selection.value.includes(currentLayerIds[i])) {
          indices.push(i);
        }
      }

      for (let i = indices.length - 1; i >= 0; i--) {
        layerIds.move(
          indices[i],
          currentLayerIds.length - 1 - (indices.length - 1 - i),
        );
      }

      history.resume();
    }, [layerIds.value, selection.value]);

    const moveToBack = useCallback(() => {
      history.pause();

      const currentLayerIds = layerIds.value;
      const indices: number[] = [];

      for (let i = 0; i < currentLayerIds.length; i++) {
        if (selection.value.includes(currentLayerIds[i])) {
          indices.push(i);
        }
      }

      for (let i = 0; i < indices.length; i++) {
        layerIds.move(indices[i], i);
      }

      history.resume();
    }, [layerIds.value, selection.value]);

    const setFill = useCallback(
      (fill: Color) => {
        setLastUsedColor(fill);

        selection.value.forEach((id) => {
          const layer = layers.value.get(id);
          if (layer) {
            layer["fill"] = fill;
            layers.update(id, layer);
          }
        });
      },
      [selection.value],
    );

    const deleteLayers = useDeleteLayers();

    const selectionBounds = useSelectionBounds();

    if (!selectionBounds) {
      return null;
    }

    const x = selectionBounds.width / 2 + selectionBounds.x + camera.x;
    const y = selectionBounds.y + camera.y;

    return (
      <div
        className="absolute p-3 rounded-xl bg-white shadow-sm border flex select-none"
        style={{
          transform: `
            translate(
              calc(${x}px - 50%),
              calc(${y - 16}px - 100%)
            )
          `,
        }}
      >
        <ColorPicker onChange={setFill} />
        <div className="flex flex-col gap-y-0.5">
          <Hint label="Bring to front">
            <Button onClick={moveToFront} variant="board" size="icon">
              <BringToFront />
            </Button>
          </Hint>
          <Hint label="Send to back" side="bottom">
            <Button onClick={moveToBack} variant="board" size="icon">
              <SendToBack />
            </Button>
          </Hint>
        </div>
        <div className="flex items-center pl-2 ml-2 border-l border-e-neutral-200a">
          <Hint label="Delete">
            <Button variant="board" size="icon" onClick={deleteLayers}>
              <Trash2 />
            </Button>
          </Hint>
        </div>
      </div>
    );
  },
);

SelectionTools.displayName = "SelectionTools";
