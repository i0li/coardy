import { CanvasMode, CanvasState, Layer, Layers } from "@/types/canvas";
import { nanoid } from "@liveblocks/core";
import { Currency, TrainTrack } from "lucide-react";
import { useState, FC, createContext, ReactNode } from "react";

const MAX_HISTORY = 30;

export type CanvasContextType = {
  layerIds: {
    value: string[];
    push: (id: string) => void;
    move: (index: number, newIndex: number) => void;
    remove: (id: string) => void;
  };
  selection: {
    value: string[];
    update: (ids: string[]) => void;
  };
  layers: {
    value: Layers;
    push: (id: string, layer: Layer) => void;
    update: (id: string, layer: Layer) => void;
    delete: (id: string) => void;
  };
  canvasState: {
    value: CanvasState;
    update: (canvasState: CanvasState) => void;
  };
  hisotory: {
    redo: () => void;
    undo: () => void;
    pause: () => void;
    resume: () => void;
  };
};

export const CanvasContext = createContext<CanvasContextType | null>(null);

const CanvasProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [layerIds, setLayerIds] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [layers, setLayers] = useState<Layers>(new Map());
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [history, setHistory] = useState<Layers[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
  const [trackHistory, setTrackHistory] = useState<boolean>(true);

  //layerIds
  const pushLayerId = (newLayerId: string) => {
    setLayerIds([...layerIds, newLayerId]);
  };

  const moveLayerId = (index: number, newIndex: number) => {
    if (
      index < 0 ||
      index >= layerIds.length ||
      newIndex < 0 ||
      newIndex >= layerIds.length
    ) {
      throw new Error("Invalid index or newIndex");
    }
    const newLayerIds = layerIds;

    const targetId = layerIds.slice(index, 1);
    newLayerIds.splice(newIndex, 0, targetId[0]);

    setLayerIds(newLayerIds);
  };

  const removeLayerId = (id: string) => {
    const newLayerIds = layerIds.filter((item: string) => {
      return item != id;
    });
    setLayerIds(newLayerIds);
  };

  // selection
  const updateSelection = (ids: string[]) => {
    setSelection(ids);
  };

  // layers
  const pushLayer = (id: string, layer: Layer) => {
    const newLayers = new Map(layers);
    newLayers.set(id, layer);
    setLayers(newLayers);
    addToHistory(newLayers);
  };

  const updateLayer = (id: string, layer: Layer) => {
    const updatedLayers = new Map(layers);
    updatedLayers.set(id, layer);
    setLayers(updatedLayers);

    if (trackHistory) {
      addToHistory(updatedLayers);
    }
  };

  const deleteLayer = (id: string) => {
    const deletedLayers = new Map(layers);
    deletedLayers.delete(id);
    setLayers(deletedLayers);
    addToHistory(deletedLayers);
  };

  // canvasState
  const updateCanvasState = (canvasState: CanvasState) => {
    setCanvasState(canvasState);
  };

  // history
  const addToHistory = (layers: Layers) => {
    const newHistory = history;
    newHistory.splice(
      currentHistoryIndex,
      history.length - 1 - currentHistoryIndex,
    );

    if (history.length >= MAX_HISTORY) {
      newHistory.shift();
    }
    newHistory.push(layers);
    setHistory(newHistory);
    setCurrentHistoryIndex(history.length - 1);
  };

  const redoHistory = () => {
    if (currentHistoryIndex >= history.length) {
      return;
    }

    setCurrentHistoryIndex(currentHistoryIndex + 1);
  };

  const undoHistory = () => {
    if (currentHistoryIndex <= 0) {
      return;
    }

    setCurrentHistoryIndex(currentHistoryIndex - 1);
  };

  const pauseHistory = () => {
    setTrackHistory(false);
  };

  const resumeHistory = () => {
    setTrackHistory(true);
  };

  return (
    <CanvasContext.Provider
      value={{
        layerIds: {
          value: layerIds,
          push: pushLayerId,
          move: moveLayerId,
          remove: removeLayerId,
        },
        selection: {
          value: selection,
          update: updateSelection,
        },
        layers: {
          value: layers,
          push: pushLayer,
          update: updateLayer,
          delete: deleteLayer,
        },
        canvasState: {
          value: canvasState,
          update: updateCanvasState,
        },
        hisotory: {
          redo: redoHistory,
          undo: undoHistory,
          pause: pauseHistory,
          resume: resumeHistory,
        },
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export default CanvasProvider;
