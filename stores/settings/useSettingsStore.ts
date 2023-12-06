// stores/useSettingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

type SettingsStateType = {
  allowDeleteAllItems: boolean;
  showParentItemListInternals: boolean;
  showParentItemIdentifiers: boolean;
  impersonatingUserAuthProviderId: string | null;
};

type SettingsActionsType = {
  toggleShowParentItemListInternals: () => void;
  toggleAllowDeleteAllItems: () => void;
};

type SettingsStoreType = SettingsStateType & SettingsActionsType;

const storeNameSuffix = `list.devel.resumedit.local`;
const storeVersion = 1;

const useSettingsStore = create(
  persist(
    immer<SettingsStoreType>((set /*, get */) => ({
      allowDeleteAllItems: true,
      showParentItemListInternals: true,
      showParentItemIdentifiers: true,
      impersonatingUserAuthProviderId: null,

      toggleShowParentItemListInternals: (): void => {
        set((state) => {
          state.showParentItemListInternals = !state.showParentItemListInternals;
        });
      },

      toggleAllowDeleteAllItems: (): void => {
        set((state) => {
          state.allowDeleteAllItems = !state.allowDeleteAllItems;
        });
      },
    })),
    {
      name: `settings-storage-${storeNameSuffix}`, // unique name for localStorage key
      version: storeVersion,
    },
  ),
);

export default useSettingsStore;
