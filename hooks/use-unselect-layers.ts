import { useCanvasContext } from "@/context/canvas-context";
import { useCallback } from "react";

export const useUnselectLayers = () => {
  const { selection, history } = useCanvasContext();

  return useCallback(() => {
    if (selection.value.length > 0) {
      selection.update([]);
      history.resume();
    }
  }, [selection.value, history.value]);
};
