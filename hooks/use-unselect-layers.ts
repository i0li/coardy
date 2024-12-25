import { useMutation } from "@liveblocks/react/suspense";

export const useUnselectLayers = () => {
  return useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);
};
