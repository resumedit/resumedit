// stores/useSettingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type SettingsStateType = {
  // Settings to be exposed to user
  synchronizationInterval: number;

  // Flags have an effect only in development environment
  // TODO: Make sure those flags are not exposed in settings in production
  showItemDescendantInternals: boolean;
  showItemDescendantIdentifiers: boolean;
  showItemDescendantSynchronization: boolean;
  // allowDeleteAllItems: boolean;
  // impersonatingUserAuthProviderId: string | null;
};

type SettingsActionsType = {
  setSettings: (newSettings: SettingsStateType) => void;
  setSynchronizationInterval: (newInterval: number) => void;
  // toggleAllowDeleteAllItems: () => void;
};

type SettingsStoreType = SettingsStateType & SettingsActionsType;

const storeNameSuffix = `devel.resumedit.local`;
const storeVersion = 1;

const useSettingsStore = create(
  persist(
    immer<SettingsStoreType>((set /*, get */) => ({
      synchronizationInterval: 0,
      showItemDescendantInternals: false,
      showItemDescendantIdentifiers: false,
      showItemDescendantSynchronization: false,
      // allowDeleteAllItems: false,
      // impersonatingUserAuthProviderId: null,

      setSettings: (newSettings): void => {
        set((state) => {
          Object.assign(state, newSettings);
        });
      },

      setSynchronizationInterval: (newInterval: number): void => {
        set((state) => {
          state.synchronizationInterval = newInterval;
        });
      },
    })),
    {
      name: `settings.${storeNameSuffix}`, // unique name for localStorage key
      version: storeVersion,
    },
  ),
);

export default useSettingsStore;
