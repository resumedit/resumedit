// @/stores/parentItemList/createParentItemListStore.ts
import { getItemId } from "@/schemas/id";
import {
  ItemClientStateType,
  ItemDataType,
  ItemDataUntypedType,
  ItemDisposition,
  ItemOutputType,
  ItemServerToClientType,
  OrderableItemClientStateType,
} from "@/types/item";
import {
  ClientIdType,
  ParentItemListState,
  ParentItemListStore,
  ParentItemListType,
  ParentItemModelAccessor,
  getParentModel,
} from "@/types/parentItemList";
import { ModificationTimestampType } from "@/types/timestamp";
import { parse, stringify } from "devalue";
import { Draft } from "immer";
import { create } from "zustand";
import { PersistStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { reBalanceListOrderValues, updateListOrderValues } from "./utills/itemOrderValues";
import { logUpdateStoreWithServerData } from "./utills/logParentItemListStore";
import { handleParentItemListFromServer } from "./utills/syncParentItemList";

function createTypesafeLocalstorage<P extends ItemClientStateType, I extends ItemClientStateType>(): PersistStorage<
  ParentItemListState<P, I>
> {
  return {
    getItem: (name) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      return parse(str);
    },
    setItem: (name, value) => {
      // localStorage.setItem(name, stringify(value));
      // Create a deep clone of the value, excluding functions
      const valueWithoutFunctions = JSON.parse(
        JSON.stringify(value, (key, val) => (typeof val === "function" ? undefined : val)),
      );
      localStorage.setItem(name, stringify(valueWithoutFunctions));
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  };
}

const storeVersion = 3;
const storeNameSuffix = "list.devel.resumedit.local";

export interface StoreConfigType {
  itemModel: keyof ParentItemModelAccessor;
  storeVersion?: number;
  storeName?: string;
  logUpdateFromServer?: boolean;
}

export const createParentItemListStore = <P extends ItemClientStateType, I extends ItemClientStateType>(
  props: StoreConfigType,
) => {
  // Retrieve the parent model
  const parentModel = getParentModel(props.itemModel);
  const itemModel = props.itemModel;
  const storeName = `${itemModel}-${storeNameSuffix}`;

  return create(
    persist(
      immer<ParentItemListStore<P, I>>((set, get) => ({
        parentModel: parentModel,
        itemModel: itemModel,
        parent: null,
        items: [],
        itemDraft: {} as I,
        serverModified: new Date(0),
        synchronizationInterval: 0,

        setParent: (parent) => {
          set((state) => {
            state.parent = parent as Draft<P>;
          });
        },

        getItemList: () => {
          return get().items;
        },
        setItemList: (items: I[]) => {
          set((state) => {
            state.items = items as Draft<I>[]; // Explicitly cast to Draft<C>[]
          });
        },
        // addItem: (newItem: Omit<ItemInputType, "order">) => {
        // addItem: (newItem: C) => {
        addItem: (itemData: ItemDataType<I>) => {
          const clientId = getItemId();
          // Add the extra fields for type `ItemClientType`
          const data = {
            clientId,
            createdAt: new Date(),
            lastModified: new Date(),
            disposition: ItemDisposition.New,
            ...itemData,
          } as unknown as Draft<I>;
          set((state) => {
            // Append it to the end of the store's `items` array
            state.items.push(data);

            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
          return clientId;
        },
        getItem: (clientId: ClientIdType): I | undefined => {
          const items = get().items;
          if (items) {
            return items.find((a) => a.clientId === clientId);
          }
          return undefined;
        },
        setItemSynced: (clientId: ClientIdType, serverData: ItemOutputType) => {
          set((state) => {
            const itemIndex = state.items.findIndex((a) => a.clientId === clientId);
            if (itemIndex !== -1) {
              state.items[itemIndex] = {
                ...state.items[itemIndex],
                id: serverData.id,
                disposition: ItemDisposition.Synced,
              };
            }
          });
        },
        markItemAsDeleted: (clientId: ClientIdType): void => {
          // Update the state with the deletedAt timestamp for the specified item
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, disposition: ItemDisposition.Modified, deletedAt: new Date() };
              }
              return item;
            });
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        restoreDeletedItem: (clientId: ClientIdType): void => {
          // Update the state with the deletedAt timestamp of the specified item reset
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, disposition: ItemDisposition.Modified, deletedAt: null };
              }
              return item;
            });
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        deleteItem: (clientId: ClientIdType): void => {
          set((state) => {
            state.items = state.items.filter((a) => a.clientId !== clientId);
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        setItemData: (clientId: ClientIdType, itemData: ItemDataUntypedType): void => {
          // Update the state with the new content for the specified item
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, ...itemData, disposition: ItemDisposition.Modified, lastModified: new Date() };
              }
              return item;
            });
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        setItemDataUntyped: (clientId: ClientIdType, itemData: ItemDataUntypedType): void => {
          // Update the state with the new content for the specified item
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, ...itemData, disposition: ItemDisposition.Modified, lastModified: new Date() };
              }
              return item;
            });
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        reArrangeItemList: (reArrangedItems: OrderableItemClientStateType[]): void => {
          set((state) => {
            state.items = updateListOrderValues(reArrangedItems) as unknown as Array<I> as Draft<I>[];
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        resetItemListOrderValues: (): void => {
          set((state) => {
            state.items = reBalanceListOrderValues(
              state.items as unknown as OrderableItemClientStateType[],
              true,
            ) as unknown as Draft<I>[];
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          });
        },
        updateItemDraft: (itemData: ItemDataUntypedType) =>
          set((state) => {
            state.itemDraft = { ...(state.itemDraft as ItemDataType<I>), ...(itemData as ItemDataType<I>) } as Draft<
              ItemDataType<I>
            >;
            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }
          }),
        commitItemDraft: () => {
          // Generate a new clientId
          const clientId = getItemId();

          set((state) => {
            // Create a copy of the draft
            const itemData = { ...(state.itemDraft as ItemDataType<I>) } as ItemDataType<I>;

            // Construct the new item
            const newItem = {
              clientId,
              createdAt: new Date(),
              lastModified: new Date(),
              disposition: ItemDisposition.New,
              ...itemData,
            } as unknown as Draft<I>;

            // Append it to the end of the store's `items` array
            state.items.push(newItem);

            // Update the modification timestamp
            if (state.parent) {
              state.parent.lastModified = new Date();
            }

            // Reset the draft
            state.itemDraft = {} as Draft<ItemDataType<I>>;
          });
        },
        updateStoreWithServerData: (
          serverState: ParentItemListType<ItemServerToClientType, ItemServerToClientType>,
        ) => {
          if (props.logUpdateFromServer) {
            logUpdateStoreWithServerData({ parent: get().parent, items: get().items }, serverState);
          }
          set((state) => {
            const updatedState = handleParentItemListFromServer(state, serverState);
            if (updatedState === null) {
              console.log(`No updated`);
            }
          });
        },
        getLastModified: (): ModificationTimestampType | undefined => {
          return get().parent?.lastModified;
        },
        setLastModified: (timestamp: ModificationTimestampType): void => {
          set((state) => {
            if (state.parent) {
              state.parent.lastModified = timestamp;
            }
          });
        },
        getSynchronizationInterval: (): number => {
          return get().synchronizationInterval;
        },
        setSynchronizationInterval: (interval: number): void => {
          set((state) => {
            state.synchronizationInterval = interval;
          });
        },
      })),
      { name: storeName, version: storeVersion, storage: createTypesafeLocalstorage<P, I>() },
    ),
  );
};
