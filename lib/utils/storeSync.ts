import { isClient } from "@/lib/utils/identifyClientOrServer";
import { useMemo, useRef } from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";

/*
Source: https://greenonsoftware.com/articles/integrations/how-to-integrate-state-management-in-zustand-with-nextjs/

useStoreSync hook takes two arguments:
1. useStore: the original Zustand store hook
2. state: the initial state received from the server

It uses useRef to keep track of whether synchronization has occurred.

It creates a new Zustand store (useServerStore) with the initial state 
from the server.

If synchronization has not yet occurred (synced.current is false), it 
sets the state of the client's Zustand store (useStore) to the initial 
state received from the server.
Finally, it returns the original useStore hook if the code is running on 
the client or the newly created useServerStore if it's running on the server.

Usage of useStoreSync Hook:

To use the useStoreSync hook in your components, you simply pass your
original Zustand store hook (e.g., useCounterStore) and the initial state
received from the server.

This ensures that the client's Zustand store is initialized with the
correct server state.
*/

const useStoreSync = <T>(
  useStore: UseBoundStore<StoreApi<T>>,
  state: T,
  clientModified?: <T>(useStore: UseBoundStore<StoreApi<T>>, state: T) => boolean,
): UseBoundStore<StoreApi<T>> => {
  const synced = useRef(false);
  const useServerStore = useMemo(() => create<T>(() => state), [state]);

  if (synced.current) {
    if (clientModified) {
      const clientState = useStore.getState();
      if (clientState) {
        synced.current = clientModified(useStore, state);
      }
    }
    if (synced.current) {
      useStore.setState(state);
    }
    synced.current = false;
  }

  return isClient() ? useStore : useServerStore;
};

export { useStoreSync };
