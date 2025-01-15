import { useRef, useEffect, useState, useCallback } from "react";
import { Kalam } from "next/font/google";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";

import { CanvasState } from "@/types/canvas";
import { CanvasMode, TextLayer } from "@/types/canvas";
import { cn, colorToCss } from "@/lib/utils";
import { useCanvasContext } from "@/context/canvas-context";

const font = Kalam({
  subsets: ["latin"],
  weight: ["400"],
});

const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.5;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize);
};

interface TextProps {
  id: string;
  layer: TextLayer;
  setCanvasState: (newState: CanvasState) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const Text = ({
  id,
  layer,
  setCanvasState,
  onPointerDown,
  selectionColor,
}: TextProps) => {
  const { layers } = useCanvasContext();
  const { x, y, width, height, fill, value } = layer;

  const [isDisabled, setIsDisabled] = useState(true);

  const contentEditableRef = useRef<HTMLDivElement>(null);

  const updateValue = useCallback((newValue: string) => {
    const liveLayer = layers.value.get(id);

    if (!liveLayer) {
      return;
    }

    liveLayer["value"] = newValue;
    layers.update(id, liveLayer);
  }, []);

  const handleContentChange = (e: ContentEditableEvent) => {
    updateValue(e.target.value);
  };

  // to ignore key down event in canvas.tsx
  useEffect(() => {
    const handleNativeKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
    };

    const element = contentEditableRef.current;
    if (element) {
      element.addEventListener("keydown", handleNativeKeyDown);
    }

    return () => {
      if (element) {
        element.removeEventListener("keydown", handleNativeKeyDown);
      }
    };
  }, []);

  // to ignore pointer evnet in canvas.tsx
  const stopPointerEventIfEditable = (e: React.PointerEvent) => {
    if (!isDisabled) {
      e.stopPropagation();
    }
  };
  useEffect(() => {
    if (!isDisabled) {
      setCanvasState({ mode: CanvasMode.TextEditing });
      contentEditableRef.current?.focus();
    }
  }, [isDisabled]);

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
      }}
    >
      <ContentEditable
        innerRef={contentEditableRef}
        html={value || "<div><b></div>"}
        onChange={handleContentChange}
        disabled={isDisabled}
        onDoubleClick={() => setIsDisabled(false)}
        onBlur={() => setIsDisabled(true)}
        onPointerMove={stopPointerEventIfEditable}
        onPointerUp={stopPointerEventIfEditable}
        onPointerDown={stopPointerEventIfEditable}
        className={cn(
          "h-full w-full flex flex-col items-center justify-center text-center outline-none break-all",
          font.className,
        )}
        style={{
          // fontSize: calculateFontSize(width, height),
          fontSize: 18,
          color: fill ? colorToCss(fill) : "#000",
          userSelect: isDisabled ? "none" : "",
        }}
      />
    </foreignObject>
  );
};
