import { CanvasState, LayerType } from "@/types/canvas";
import { memo } from "react";
import { Text } from "./text";
import { Ellipse } from "./ellipse";
import { Rectangle } from "./rectangle";
import { Note } from "./note";
import { Path } from "./path";
import { colorToCss } from "@/lib/utils";
import { useCanvasContext } from "@/context/canvas-context";

interface LayerPreviewProps {
  id: string;
  setCanvasState: (newState: CanvasState) => void;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selectionColor?: string;
}

export const LayerPreview = memo(
  ({
    id,
    setCanvasState,
    onLayerPointerDown,
    selectionColor,
  }: LayerPreviewProps) => {
    const { layers } = useCanvasContext();
    const layer = layers.value.get(id);

    if (!layer) {
      return null;
    }

    switch (layer.type) {
      case LayerType.Path:
        return (
          <Path
            key={id}
            points={layer.points}
            onPointerDown={(e) => onLayerPointerDown(e, id)}
            x={layer.x}
            y={layer.y}
            fill={layer.fill ? colorToCss(layer.fill) : "#000"}
            stroke={selectionColor}
          />
        );
      case LayerType.Note:
        return (
          <Note
            id={id}
            layer={layer}
            setCanvasState={setCanvasState}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Text:
        return (
          <Text
            id={id}
            layer={layer}
            setCanvasState={setCanvasState}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Ellipse:
        return (
          <Ellipse
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      case LayerType.Rectangle:
        return (
          <Rectangle
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        );
      default:
        console.warn("Unknown layer type");
        return null;
    }
  },
);

LayerPreview.displayName = "LayerPreview";
