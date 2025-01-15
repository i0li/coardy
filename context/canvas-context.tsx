"use client";

import {
  CanvasMode,
  CanvasState,
  Color,
  Layer,
  Layers,
  PencilDraftItem,
  Point,
} from "@/types/canvas";
import { useState, FC, createContext, ReactNode, useContext } from "react";

const MAX_HISTORY = 30;

export type CanvasContextType = {
  cursor: {
    value: Point | null;
    update: (point: Point | null) => void;
  };
  pencilDraft: {
    value: PencilDraftItem[] | null;
    update: (pencilDrafts: PencilDraftItem[] | null) => void;
  };
  penColor: {
    value: Color | null;
    update: (color: Color | null) => void;
  };
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
  history: {
    value: Layers[];
    redo: () => void;
    undo: () => void;
    canRedo: () => boolean;
    canUndo: () => boolean;
    pause: () => void;
    resume: () => void;
  };
};

export const CanvasContext = createContext<CanvasContextType>({
  cursor: {
    value: null,
    update: () => {},
  },
  pencilDraft: {
    value: null,
    update: () => {},
  },
  penColor: {
    value: null,
    update: () => {},
  },
  layerIds: {
    value: [],
    push: () => {},
    move: () => {},
    remove: () => {},
  },
  selection: {
    value: [],
    update: () => {},
  },
  layers: {
    value: new Map(),
    push: () => {},
    update: () => {},
    delete: () => {},
  },
  canvasState: {
    value: {
      mode: CanvasMode.None,
    },
    update: () => {},
  },
  history: {
    value: [],
    redo: () => {},
    undo: () => {},
    canRedo: () => {
      return false;
    },
    canUndo: () => {
      return false;
    },
    pause: () => {},
    resume: () => {},
  },
});

const CanvasProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [cursor, setCursor] = useState<Point | null>(null);
  const [pencilDraft, setPencilDraft] = useState<PencilDraftItem[] | null>(
    null,
  );
  const [penColor, setPenColor] = useState<Color | null>(null);
  const [layerIds, setLayerIds] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [layers, setLayers] = useState<Layers>(new Map());
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [history, setHistory] = useState<Layers[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
  const [trackHistory, setTrackHistory] = useState<boolean>(true);

  //cursor
  const updateCusor = (point: Point | null) => {
    setCursor(point);
  };

  //pencilDraft
  const updatePencilDraft = (pencilDrafts: PencilDraftItem[] | null) => {
    setPencilDraft(pencilDrafts);
  };

  //penColor
  const updatePenColor = (color: Color | null) => {
    setPenColor(color);
  };

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
    const targetId = newLayerIds.splice(index, 1)[0];
    setLayerIds([
      ...newLayerIds.slice(0, newIndex),
      targetId,
      ...newLayerIds.slice(newIndex),
    ]);
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
    const updatedLayers = layers;
    updatedLayers.set(id, layer);
    setLayers(updatedLayers);

    if (trackHistory) {
      addToHistory(updatedLayers);
    }
  };

  const deleteLayer = (id: string) => {
    const deletedLayers = layers;
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
    if (!canRedoHistory) {
      return;
    }

    setCurrentHistoryIndex(currentHistoryIndex + 1);
  };

  const undoHistory = () => {
    if (!canUndoHistory) {
      return;
    }

    setCurrentHistoryIndex(currentHistoryIndex - 1);
  };

  const canRedoHistory = () => {
    return currentHistoryIndex < history.length;
  };

  const canUndoHistory = () => {
    return currentHistoryIndex > 0;
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
        cursor: {
          value: cursor,
          update: updateCusor,
        },
        pencilDraft: {
          value: pencilDraft,
          update: updatePencilDraft,
        },
        penColor: {
          value: penColor,
          update: updatePenColor,
        },
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
        history: {
          value: history,
          redo: redoHistory,
          undo: undoHistory,
          canRedo: canRedoHistory,
          canUndo: canUndoHistory,
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

export const useCanvasContext = (): CanvasContextType => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasContext");
  }
  return context;
};
