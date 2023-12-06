// stores/useSettingsStore.ts
import { siteConfig } from "@/config/site";
import { StateCreator, create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type AppSettingsStoreState = {
  // Settings to be exposed to user
  synchronizationInterval: number;

  // Flags have an effect only in development environment
  // TODO: Make sure those flags are not exposed in settings in production
  showItemDescendantInternals: boolean;
  showItemDescendantIdentifiers: boolean;
  showItemDescendantSynchronization: boolean;
  // allowDeleteAllItems: boolean;
  // impersonatingUserAuthProviderId: string | null;
  isLoggingEnabled: boolean;
};

export type AppSettingsStoreActions = {
  setSettings: (newSettings: AppSettingsStoreState) => void;
  setSynchronizationInterval: (newInterval: number) => void;
  // toggleAllowDeleteAllItems: () => void;
};

export type AppSettingsStore = AppSettingsStoreState & AppSettingsStoreActions;

// Selector type is used to type the return type when using the store with a selector
type AppSettingsSelectorType<T> = (state: AppSettingsStoreState) => T;

// Hook type is used as a return type when using the store
export type AppSettingsHookType = <T>(selector?: AppSettingsSelectorType<T>) => T;

export const updateGlobalLogging =
  <T extends { isLoggingEnabled: boolean }>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      (args) => {
        set(args);
        // Update the global variable whenever isLoggingEnabled changes
        window[siteConfig.name].isLoggingEnabled = get().isLoggingEnabled;
      },
      get,
      api,
    );

const storeNameSuffix =
  process.env.NODE_ENV === "development" ? `devel.${siteConfig.canonicalDomainName}` : siteConfig.canonicalDomainName;
const storeVersion = 1;

const useAppSettingsStore = create(
  persist(
    immer<AppSettingsStore>((set /*, get */) => ({
      synchronizationInterval: 0,
      showItemDescendantInternals: false,
      showItemDescendantIdentifiers: false,
      showItemDescendantSynchronization: false,
      // allowDeleteAllItems: false,
      // impersonatingUserAuthProviderId: null,
      isLoggingEnabled: false,

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

export default useAppSettingsStore;
