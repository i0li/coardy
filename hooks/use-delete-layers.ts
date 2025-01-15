import { useCallback, useContext } from "react";
import { CanvasContext } from "@/context/canvas-context";

export const useDeleteLayers = () => {
  const { selection, layerIds, layers, history } = useContext(CanvasContext);

  return useCallback(() => {
    for (const id of selection.value) {
      layers.delete(id);

      if (layerIds.value.includes(id)) {
        layerIds.remove(id);
      }
    }

    selection.update([]);
    history.resume();
  }, [layers.value, selection.value, history.value, layerIds.value]);
};
