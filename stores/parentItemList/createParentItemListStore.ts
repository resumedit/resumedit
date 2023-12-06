// @/stores/parentItemList/createParentItemListStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { IdSchemaType, getItemId, isValidItemId } from "@/schemas/id";
import { ItemClientStateType, ItemDataType, ItemDataUntypedType, ItemDisposition, ItemOutputType } from "@/types/item";
import {
  ClientIdType,
  ParentItemListStore,
  ParentItemListType,
  ParentItemModelAccessor,
  getParentModel,
} from "@/types/parentItemList";
import { ModificationTimestampType } from "@/types/timestamp";
import { Draft } from "immer";
import { handleParentItemListFromServer } from "./utills/handleParentItemListFromServer";

export interface StoreConfigType {
  itemModel: keyof ParentItemModelAccessor;
  storeVersion?: number;
  storeName?: string;
}

const storeNameSuffix = `list.devel.resumedit.local`;
const storeVersion = 2;
export const createParentItemListStore = <T extends ItemClientStateType>(props: StoreConfigType) => {
  const parentModel: keyof ParentItemModelAccessor = getParentModel(props.itemModel);
  const itemModel = props.itemModel;
  const storeName = `${parentModel}-${itemModel}-${storeNameSuffix}`;
  return create(
    persist(
      immer<ParentItemListStore<T>>((set, get) => ({
        parentModel: parentModel,
        parentId: null,
        itemModel: itemModel,
        items: [],
        itemDraft: {} as ItemDataType<T>,
        lastModified: new Date(0),
        serverModified: new Date(0),
        synchronizationInterval: 0,

        getParentId: (): IdSchemaType | null => {
          return get().parentId;
        },
        setParentId: (id: IdSchemaType): void => {
          set((state) => {
            state.parentId = id;
          });
        },
        getItemList: () => {
          return get().items;
        },
        setItemList: (items: T[]) => {
          set((state) => {
            state.items = items as Draft<T>[]; // Explicitly cast to Draft<T>[]
          });
        },
        // addItem: (newItem: Omit<ItemInputType, "order">) => {
        // addItem: (newItem: T) => {
        addItem: (itemData: ItemDataType<T>) => {
          const clientId = getItemId();
          // Add the extra fields for type `ItemClientType`
          const data = {
            clientId,
            createdAt: new Date(),
            lastModified: new Date(),
            disposition: ItemDisposition.New,
            ...itemData,
          } as unknown as Draft<T>;
          set((state) => {
            // Append it to the end of the store's `items` array
            state.items.push(data);

            // Update the modification timestamp
            state.lastModified = new Date();
          });
          return clientId;
        },
        getItem: (clientId: ClientIdType): T | undefined => {
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
        setItemDeleted: (clientId: ClientIdType): void => {
          // Update the state with the deleted state for the specified item
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, disposition: ItemDisposition.Deleted };
              }
              return item;
            });
            state.lastModified = new Date();
          });
        },
        deleteItem: (clientId: ClientIdType): void => {
          set((state) => {
            state.items = state.items.filter((a) => a.clientId !== clientId);
            state.lastModified = new Date();
          });
        },
        setItemData: (clientId: ClientIdType, itemData: ItemDataUntypedType): void => {
          // Update the state with the new content for the specified item
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, ...itemData, disposition: ItemDisposition.Modified };
              }
              return item;
            });
            state.lastModified = new Date();
          });
        },
        setItemDataUntyped: (clientId: ClientIdType, itemData: ItemDataUntypedType): void => {
          // Update the state with the new content for the specified item
          set((state) => {
            state.items = state.items.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, ...itemData, disposition: ItemDisposition.Modified };
              }
              return item;
            });
            state.lastModified = new Date();
          });
        },
        deleteItemsByDisposition: (disposition?: ItemDisposition): void => {
          const removeDisposition = disposition ? disposition : ItemDisposition.Deleted;
          set((state) => {
            state.items = state.items.filter((a) => a.disposition !== removeDisposition);
            state.lastModified = new Date();
          });
        },
        updateItemDraft: (itemData: ItemDataUntypedType) =>
          set((state) => {
            state.itemDraft = { ...(state.itemDraft as ItemDataType<T>), ...(itemData as ItemDataType<T>) } as Draft<
              ItemDataType<T>
            >;
            state.lastModified = new Date();
          }),
        commitItemDraft: () => {
          // Generate a new clientId
          const clientId = getItemId();

          set((state) => {
            // // Create a copy of the draft
            // const itemData = { ...(state.itemDraft as ItemDataType<T>) } as ItemDataType<T>;
            // // Use the existing addItem function to add the draft as a new item
            // const addItemFunction = get().addItem;
            // addItemFunction(itemData);

            // // Reset the draft
            // state.itemDraft = {} as Draft<ItemDataType<T>>;

            // Create a copy of the draft
            const itemData = { ...(state.itemDraft as ItemDataType<T>) } as ItemDataType<T>;

            // Construct the new item
            const newItem = {
              clientId,
              createdAt: new Date(),
              lastModified: new Date(),
              disposition: ItemDisposition.New,
              ...itemData,
            } as unknown as Draft<T>;

            // Append it to the end of the store's `items` array
            state.items.push(newItem);

            // Update the modification timestamp
            state.lastModified = new Date();

            // Reset the draft
            state.itemDraft = {} as Draft<ItemDataType<T>>;
          });
        },
        updateStoreWithServerData: (serverState: ParentItemListType<ItemOutputType>) => {
          console.log(
            `useParentItemListStore/updateStoreWithServerData: parentId=${get().parentId} serverState.parentId=${
              serverState.parentId
            }`,
          );
          const currentParentId = get().parentId || serverState.parentId;

          if (!isValidItemId(currentParentId)) {
            throw Error(`useParentItemListStore/updateStoreWithServerData: parentId is ${get().parentId}`);
          }
          // At this point, TypeScript knows currentParentId is not null
          // We can safely cast currentParentId to IdSchemaType
          const validParentId = currentParentId as IdSchemaType;
          set((state) => {
            const updatedState = handleParentItemListFromServer({ ...state, parentId: validParentId }, serverState);
            if (updatedState === null) {
              state.items.forEach((item) => {
                if (!(item.createdAt instanceof Date)) {
                  console.log(`useParentItemListStore/updateStoreWithServerData: invalid createdAt:`, item.createdAt);
                  item.createdAt = new Date(0);
                }
                if (!(item.lastModified instanceof Date)) {
                  console.log(
                    `useParentItemListStore/updateStoreWithServerData: invalid lastModified:`,
                    item.lastModified,
                  );
                  item.lastModified = new Date(0);
                }
                item.disposition = ItemDisposition.Synced;
              });
            } else if (updatedState && updatedState.parentId && updatedState.items && updatedState.lastModified) {
              state.parentId = updatedState.parentId;
              state.items = updatedState.items;
              state.lastModified = updatedState.lastModified;
              state.serverModified = updatedState.lastModified;
            } else {
              console.log(
                `useParentItemListStore: updateStoreWithServerData -> processUpdateFromServer returned invalid updatedState:`,
                updatedState,
              );
            }
          });
        },
        getLastModified: (): ModificationTimestampType => {
          return get().lastModified;
        },
        setLastModified: (timestamp: ModificationTimestampType): void => {
          set((state) => {
            state.lastModified = timestamp;
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
      { name: storeName, version: storeVersion },
    ),
  );
};
