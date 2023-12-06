// stores/useSettingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type SettingsStateType = {
  showParentItemListInternals: boolean;
  showParentItemIdentifiers: boolean;
  showParentItemListSynchronization: boolean;
  // allowDeleteAllItems: boolean;
  // impersonatingUserAuthProviderId: string | null;
};

type SettingsActionsType = {
  setSettings: (newSettings: SettingsStateType) => void;
  // toggleShowParentItemListInternals: () => void;
  // toggleAllowDeleteAllItems: () => void;
};

type SettingsStoreType = SettingsStateType & SettingsActionsType;

const storeNameSuffix = `devel.resumedit.local`;
const storeVersion = 1;

const useSettingsStore = create(
  persist(
    immer<SettingsStoreType>((set /*, get */) => ({
      showParentItemListInternals: false,
      showParentItemIdentifiers: false,
      showParentItemListSynchronization: false,
      // allowDeleteAllItems: false,
      // impersonatingUserAuthProviderId: null,

      setSettings: (newSettings): void => {
        set((state) => {
          Object.assign(state, newSettings);
        });
      },

      // toggleShowParentItemListInternals: (): void => {
      //   set((state) => {
      //     state.showParentItemListInternals = !state.showParentItemListInternals;
      //   });
      // },
    })),
    {
      name: `settings.${storeNameSuffix}`, // unique name for localStorage key
      version: storeVersion,
    },
  ),
);

export default useSettingsStore;
