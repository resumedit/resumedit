// @/stores/itemDescendant/createItemDescendantStore.ts
import { IdSchemaType, getItemId } from "@/schemas/id";
import {
  ClientIdType,
  ItemClientStateType,
  ItemDataType,
  ItemDataUntypedType,
  ItemDisposition,
  ItemOrderableClientStateType,
  ItemServerStateType,
  ItemServerToClientType,
} from "@/types/item";
import { ItemDescendantModelNameType, createDateSafeLocalstorage, getDescendantModel } from "@/types/itemDescendant";
import { Draft } from "immer";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { reBalanceListOrderValues, updateListOrderValues } from "./utils/descendantOrderValues";
import { logUpdateStoreWithServerData } from "./utils/logItemDescendantStore";
import { handleItemDescendantListFromServer } from "./utils/syncItemDescendant";

// Type used by client to maintain client state
export type ItemClientStateDescendantListType<I, C> = Array<ItemDescendantClientStateType<I, C>>;

export type ItemDescendantClientStateType<I, C> = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemClientStateDescendantListType<I, C>;
};

// The store state additionally includes a descendantDraft at the item level
export type ItemStoreStateDescendantListType<I, C> = Array<ItemDescendantStoreState<I, C>>;

export type ItemDescendantStoreState<I, C> = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemClientStateDescendantListType<I, C>;
  descendantDraft: ItemDataType<C>;
};

// Type used by client to maintain client state with orderable descendants
export type ItemOrderableClientStateDescendantListType<I, C> = Array<ItemOrderableDescendantClientStateType<I, C>>;

export type ItemOrderableDescendantClientStateType<I, C> = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemOrderableClientStateDescendantListType<I, C>;
};

// The store state additionally includes a descendantDraft at the item level
export type ItemOrderableStoreStateDescendantListType<I, C> = Array<ItemOrderableDescendantStoreStateType<I, C>>;

export type ItemOrderableDescendantStoreStateType<I, C> = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemOrderableClientStateDescendantListType<I, C>;
  descendantDraft: ItemDataType<C>;
};

export type ItemServerStateDescendantListType<I, C> = Array<ItemDescendantServerStateType<I, C>>;

// Type used by server to maintain server state
export type ItemDescendantServerStateType<I, C> = ItemServerStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemServerStateDescendantListType<I, C>;
};

export type ItemServerStateDescendantOrderableListType<I, C> = Array<ItemDescendantServerStateOrderableType<I, C>>;

export type ItemDescendantServerStateOrderableType<I, C> = ItemServerStateType & {
  order: number;
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemServerStateDescendantOrderableListType<I, C>;
};

// Type used by server to send its state to the client
export type ItemServerToClientDescendantListType<I, C> = Array<ItemDescendantServerToClientType<I, C>>;

export type ItemDescendantServerToClientType<I, C> = ItemServerToClientType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemServerToClientDescendantListType<I, C>;
};

export type ItemDescendantStoreActions<I extends ItemClientStateType, C extends ItemClientStateType> = {
  setItemData: (data: ItemDataUntypedType, clientId: ClientIdType) => void;
  markItemAsDeleted: (clientId: ClientIdType) => void;
  restoreDeletedItem: (clientId: ClientIdType) => void;
  setDescendantData: (data: ItemDataUntypedType, clientId: ClientIdType) => void;
  addDescendant: (descendantData: ItemDataType<C>) => void;
  markDescendantAsDeleted: (clientId: ClientIdType, item?: ItemDescendantClientStateType<I, C>) => void;
  reArrangeDescendants: (reArrangedDescendants: ItemClientStateDescendantListType<I, C>) => void;
  resetDescendantsOrderValues: () => void;
  updateDescendantDraft: (descendantData: ItemDataUntypedType) => void;
  commitDescendantDraft: () => void;
  updateStoreWithServerData: (
    serverState: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>,
  ) => void;
};

export type ItemDescendantStore<
  I extends ItemClientStateType,
  C extends ItemClientStateType,
> = ItemDescendantStoreState<I, C> & ItemDescendantStoreActions<I, C>;

// Selector type is used to type the return type when using the store with a selector
type ItemDescendantSelectorType<I extends ItemClientStateType, C extends ItemClientStateType, T> = (
  state: ItemDescendantStore<I, C>,
) => T;

// Hook type is used as a return type when using the store
export type ItemDescendantHookType = <I extends ItemClientStateType, C extends ItemClientStateType, T>(
  selector?: ItemDescendantSelectorType<I, C, T>,
) => T;

export interface ItemDescendantStoreConfigType {
  itemModel: ItemDescendantModelNameType;

  parentClientId: IdSchemaType;
  clientId: IdSchemaType;

  parentId: IdSchemaType | undefined;
  id: IdSchemaType | undefined;

  storeVersion?: number;
  storeName?: string;
  logUpdateFromServer?: boolean;
}
export const storeVersion = 1;
export const storeNameSuffix = "descendant-store.devel.resumedit.local";

export const createItemDescendantStore = <I extends ItemClientStateType, C extends ItemClientStateType>({
  parentClientId,
  clientId,
  parentId,
  id,
  itemModel,
  storeVersion,
  logUpdateFromServer,
  ...rest
}: ItemDescendantStoreConfigType) => {
  const storeName = rest.storeName ? rest.storeName : `${itemModel}-${storeNameSuffix}`;

  return create(
    persist(
      immer<ItemDescendantStore<I, C>>((set, get) => ({
        parentClientId,
        clientId,
        parentId,
        id,
        createdAt: new Date(0),
        lastModified: new Date(0),
        deletedAt: null,
        disposition: ItemDisposition.New,

        itemModel: itemModel,
        descendantModel: getDescendantModel(itemModel),
        descendants: [],
        descendantDraft: {} as ItemDataType<C>,
        logUpdateFromServer,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setItemData: (descendantData: ItemDataUntypedType, clientId?: ClientIdType): void => {
          // NOTE: The argument `clientId` is only here to provide the same signature as for descendants
          set((state) => {
            // Loop through each key in descendantData and update the state
            Object.keys(descendantData).forEach((key) => {
              if (key in state) {
                state[key as string as keyof Draft<ItemDescendantStore<I, C>>] = descendantData[key];
              }
            });
            state.disposition = ItemDisposition.Modified;
            state.lastModified = new Date();
          });
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        markItemAsDeleted: (clientId?: ClientIdType): void => {
          // NOTE: The argument `clientId` is only here to provide the same signature as for descendants
          // Update the state with the deletedAt timestamp for the item
          set((state) => {
            // NOTE: The below assignment with the spread operator does not work due to the use of `immer`
            // state = { ...state, disposition: ItemDisposition.Modified, deletedAt: new Date() };
            state.disposition = ItemDisposition.Modified;
            state.deletedAt = new Date();

            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        restoreDeletedItem: (clientId?: ClientIdType): void => {
          // NOTE: The argument `clientId` is only here to provide the same signature as for descendants
          // Update the state with the deletedAt timestamp for the item
          set((state) => {
            state.disposition = ItemDisposition.Modified;
            state.deletedAt = null;

            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },

        setDescendantData: (descendantData: ItemDataUntypedType, clientId: ClientIdType): void => {
          if (!clientId) {
            throw Error(`setDescendantData: clientId=${clientId}`);
          }
          // Update the state with the new content for the specified descendant
          set((state) => {
            state.descendants = state.descendants.map((descendant) => {
              if (descendant.clientId === clientId) {
                return {
                  ...descendant,
                  ...descendantData,
                  disposition: ItemDisposition.Modified,
                  lastModified: new Date(),
                };
              }
              return descendant;
            });
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        addDescendant: (descendantData: ItemDataType<C>) => {
          set((state) => {
            const descendantOfDescendantModel = state.descendantModel
              ? getDescendantModel(state.descendantModel)
              : null;
            const descendantClientId = getItemId(state.descendantModel);
            const newItem = {
              itemModel: state.descendantModel,
              clientId: descendantClientId,
              parentClientId: clientId,
              createdAt: new Date(),
              lastModified: new Date(),
              disposition: ItemDisposition.New,
              ...descendantData,
              descendantModel: descendantOfDescendantModel,
              descendants: [],
              descendantDraft: {} as Draft<ItemDataType<C>>,
            } as Draft<ItemDescendantStoreState<C, C>>;
            state.descendants = state.descendants.length
              ? [...state.descendants, newItem]
              : ([newItem] as Draft<ItemDescendantStoreState<C, C>>[]);
          });
        },
        markDescendantAsDeleted: (clientId: ClientIdType, item?: ItemDescendantClientStateType<I, C>): void => {
          if (!clientId) {
            throw Error(`setDescendantData: clientId=${clientId}`);
          }
          if (item) {
            item.descendants = item.descendants.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, disposition: ItemDisposition.Modified, deletedAt: new Date() };
              }
              return item;
            });
            // Update the modification timestamp
            item.lastModified = new Date();
          } else {
            set((state) => {
              // Update the state with the deletedAt timestamp for the specified descendant
              state.descendants = state.descendants.map((item) => {
                if (item.clientId === clientId) {
                  return { ...item, disposition: ItemDisposition.Modified, deletedAt: new Date() };
                }
                return item;
              });
              // Update the modification timestamp
              state.lastModified = new Date();
            });
          }
        },
        reArrangeDescendants: (reArrangedDescendants: ItemClientStateDescendantListType<I, C>): void => {
          set((state) => {
            state.descendants = updateListOrderValues(
              reArrangedDescendants as unknown as Array<ItemOrderableClientStateType>,
            ) as unknown as Draft<ItemOrderableStoreStateDescendantListType<I, C>>;
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        resetDescendantsOrderValues: (): void => {
          set((state) => {
            state.descendants = reBalanceListOrderValues(
              state.descendants as unknown as Array<ItemOrderableClientStateType>,
              true,
            ) as unknown as Draft<ItemOrderableStoreStateDescendantListType<I, C>>;
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        updateDescendantDraft: (descendantData: ItemDataUntypedType) =>
          set((state) => {
            state.descendantDraft = {
              ...(state.descendantDraft as ItemDataType<C>),
              ...(descendantData as ItemDataType<C>),
            } as Draft<ItemDataType<C>>;
            // Update the modification timestamp
            state.lastModified = new Date();
          }),
        commitDescendantDraft: () => {
          set((state) => {
            const descendantOfDescendantModel = state.descendantModel
              ? getDescendantModel(state.descendantModel)
              : null;
            const descendantClientId = getItemId(state.descendantModel);

            // Create a copy of the draft
            const descendantData = {
              ...(state.descendantDraft as ItemDataType<C>),
            } as ItemDataType<C>;
            // Construct the new item
            const newItem = {
              itemModel: state.descendantModel,
              clientId: descendantClientId,
              parentClientId: clientId,
              createdAt: new Date(),
              lastModified: new Date(),
              disposition: ItemDisposition.New,
              ...descendantData,
              descendantModel: descendantOfDescendantModel,
              descendants: [],
              descendantDraft: {} as Draft<ItemDataType<C>>,
            } as Draft<ItemDescendantStoreState<C, C>>;

            // Append it to the end of the store's `descendants` array
            state.descendants = state.descendants.length ? [...state.descendants, newItem] : [newItem];
            // Update the modification timestamp
            state.lastModified = new Date();

            // Reset the draft
            state.descendantDraft = {} as Draft<ItemDataType<C>>;
          });
        },
        updateStoreWithServerData: (
          serverState: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>,
        ) => {
          if (logUpdateFromServer) {
            logUpdateStoreWithServerData(
              get() as ItemDescendantStore<ItemClientStateType, ItemClientStateType>,
              serverState,
            );
          }
          set((state) => {
            handleItemDescendantListFromServer(state, serverState);
            // state.descendants = [
            //   ...state.descendants,
            //   ...serverState.descendants.map((descendant) => {
            //     return {
            //       ...descendant,
            //       clientParentId: state.clientId,
            //       parentId: getItemId(state.descendantModel),
            //       disposition: ItemDisposition.Synced,
            //     };
            //   }),
            // ];
          });
          if (logUpdateFromServer) {
            logUpdateStoreWithServerData(
              get() as ItemDescendantStore<ItemClientStateType, ItemClientStateType>,
              serverState,
            );
          }
        },
      })),
      {
        name: storeName,
        version: storeVersion,
        storage: createDateSafeLocalstorage<I, C>() /*, storage: createTypesafeLocalstorage<I, C>()*/,
      },
    ),
  );
};
