// @/stores/nestedItem/createNestedItemRecursiveStore.ts
import { IdSchemaType, getItemId } from "@/schemas/id";
import {
  ClientIdType,
  NestedItemDescendantClientStateType,
  NestedItemDescendantDataType,
  NestedItemDescendantDataUntypedType,
  NestedItemDisposition,
  NestedItemListType,
  NestedItemModelAccessor,
  NestedItemOrderableChildClientStateType,
  NestedItemServerToClientType,
  NestedItemStoreNameType,
  getDescendantModel,
} from "@/types/nestedItem";
import { Draft } from "immer";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { reBalanceListOrderValues, updateListOrderValues } from "./utils/descendantOrderValues";
import { logUpdateStoreWithServerData } from "./utils/logNestedItemRecursiveStore";
import { handleNestedItemListFromServer } from "./utils/syncNestedItem";

export type NestedItemRecursiveStoreDescendantType<
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
> = C | NestedItemRecursiveStore<I, C>;

export type NestedItemRecursiveStoreDescendantListType<
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
> = Array<NestedItemRecursiveStoreDescendantType<I, C>>;

export type NestedItemRecursiveState<
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
> = {
  clientId: IdSchemaType;
  id: IdSchemaType | undefined;
  parentId: IdSchemaType | undefined;
  createdAt: Date;
  lastModified: Date;
  deletedAt: Date | null;
  disposition: NestedItemDisposition;

  itemModel: keyof NestedItemModelAccessor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descendants: NestedItemRecursiveStoreDescendantListType<I, C>;
  descendantDraft: NestedItemDescendantDataType<C>;
};

export type NestedItemRecursiveActions<C extends NestedItemDescendantClientStateType> = {
  getItemModelStore: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store: NestedItemRecursiveStore<any, any>,
    itemModel: NestedItemStoreNameType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => NestedItemRecursiveStore<any, any>;
  setItemData: (data: NestedItemDescendantDataUntypedType, clientId: ClientIdType) => void;
  markItemAsDeleted: (clientId: ClientIdType) => void;
  setDescendantData: (data: NestedItemDescendantDataUntypedType, clientId: ClientIdType) => void;
  addDescendant: (itemData: NestedItemDescendantDataType<C>) => ClientIdType;
  markDescendantAsDeleted: (clientId: ClientIdType) => void;
  reArrangeDescendants: (reArrangedItems: NestedItemOrderableChildClientStateType[]) => void;
  resetDescendantsOrderValues: () => void;
  updateDescendantDraft: (itemData: NestedItemDescendantDataUntypedType) => void;
  commitDescendantDraft: () => void;
  updateStoreWithServerData: (
    serverState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>,
  ) => void;
};

export type NestedItemRecursiveStore<
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
> = NestedItemRecursiveState<I, C> & NestedItemRecursiveActions<C>;

// Selector type is used to type the return type when using the store with a selector
type NestedItemRecursiveSelectorType<
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
  T,
> = (state: NestedItemRecursiveStore<I, C>) => T;

// Hook type is used as a return type when using the store
export type NestedItemRecursiveHookType = <
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
  T,
>(
  selector?: NestedItemRecursiveSelectorType<I, C, T>,
) => T;

export interface NestedItemRecursiveStoreConfigType {
  itemModel: keyof NestedItemModelAccessor;

  parentClientId: IdSchemaType;
  clientId: IdSchemaType;

  parentId: IdSchemaType | undefined;
  id: IdSchemaType | undefined;

  storeVersion?: number;
  storeName?: string;
  logUpdateFromServer?: boolean;
}
export const storeVersion = 1;
export const storeNameSuffix = "nested-item-recursive.devel.resumedit.local";

export const createNestedItemRecursiveStore = <
  I extends NestedItemDescendantClientStateType,
  C extends NestedItemDescendantClientStateType,
>({
  itemModel,
  parentClientId,
  clientId,
  parentId,
  id,
  storeVersion,
  logUpdateFromServer,
  ...rest
}: NestedItemRecursiveStoreConfigType) => {
  const storeName = rest.storeName ? rest.storeName : `${itemModel}-${storeNameSuffix}`;

  return create(
    persist(
      immer<NestedItemRecursiveStore<I, C>>((set, get) => ({
        parentClientId,
        clientId,
        parentId,
        id,
        createdAt: new Date(),
        lastModified: new Date(),
        deletedAt: null,
        disposition: NestedItemDisposition.New,

        itemModel: itemModel,
        descendants: [],
        descendantDraft: {} as C,

        // Helper function to find the target state based on itemModel
        getItemModelStore: (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          store: NestedItemRecursiveStore<any, any>,
          itemModel: NestedItemStoreNameType,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ): NestedItemRecursiveStore<any, any> => {
          // Base case: If the current state's itemModel matches the target itemModel
          if (store.itemModel === itemModel) {
            return store;
          }
          // Recursive case: Search in descendants
          for (const descendant of store.descendants) {
            if (descendant.itemModel === itemModel) {
              return descendant;
            }
            const foundStore = store.getItemModelStore(descendant, itemModel);
            if (foundStore) {
              return foundStore;
            }
          }
          throw Error(
            `createNestedItemRecursiveStore:getItemModelState(itemModel="${itemModel}"): no state for itemModel`,
          );
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setItemData: (itemData: NestedItemDescendantDataUntypedType, clientId?: ClientIdType): void => {
          // NOTE: The argument `clientId` is only here to provide the same signature as for descendants
          set((state) => {
            // Loop through each key in itemData and update the state
            Object.keys(itemData).forEach((key) => {
              if (key in state) {
                // @ts-expect-error: Next line is necessary for dynamic key access
                state[key] = itemData[key];
              }
            });
            state.disposition = NestedItemDisposition.Modified;
            state.lastModified = new Date();
          });
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        markItemAsDeleted: (clientId?: ClientIdType): void => {
          // NOTE: The argument `clientId` is only here to provide the same signature as for descendants
          // Update the state with the deletedAt timestamp for the item
          set((state) => {
            state = { ...state, disposition: NestedItemDisposition.Modified, deletedAt: new Date() };

            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        setDescendantData: (itemData: NestedItemDescendantDataUntypedType, clientId: ClientIdType): void => {
          // Update the state with the new content for the specified descendant
          set((state) => {
            state.descendants = state.descendants.map((item) => {
              if (item.clientId === clientId) {
                return {
                  ...item,
                  ...itemData,
                  disposition: NestedItemDisposition.Modified,
                  lastModified: new Date(),
                };
              }
              return item;
            });
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        addDescendant: (itemData: NestedItemDescendantDataType<C>) => {
          const descendantClientId = getItemId();
          const descendantModel = getDescendantModel(itemModel);
          set((state) => {
            let newItem;
            if (descendantModel) {
              // Create the nested store of type C
              const descendantStoreProps: NestedItemRecursiveStoreConfigType = {
                itemModel: descendantModel,
                parentClientId: clientId,
                clientId: descendantClientId,
                parentId: id,
                id: undefined,
              };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const descendantStore = createNestedItemRecursiveStore<C, any>(descendantStoreProps);
              newItem = descendantStore as unknown as Draft<NestedItemRecursiveStore<I, C>>;
            } else {
              // Leaf of the hierarchy
              // Add the extra fields for type `NestedItemClientType`
              newItem = {
                clientId: descendantClientId,
                createdAt: new Date(),
                lastModified: new Date(),
                disposition: NestedItemDisposition.New,
                ...itemData,
              } as Draft<C>;
            }
            state.descendants = state.descendants.length ? [...state.descendants, newItem] : ([newItem] as Draft<C>[]);
          });
          return clientId;
        },
        markDescendantAsDeleted: (clientId: ClientIdType): void => {
          // Update the state with the deletedAt timestamp for the specified descendant
          set((state) => {
            state.descendants = state.descendants.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, disposition: NestedItemDisposition.Modified, deletedAt: new Date() };
              }
              return item;
            });
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        reArrangeDescendants: (reArrangedItems: NestedItemOrderableChildClientStateType[]): void => {
          set((state) => {
            state.descendants = updateListOrderValues(reArrangedItems) as unknown as Array<C> as Draft<C>[];
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        resetDescendantsOrderValues: (): void => {
          set((state) => {
            state.descendants = reBalanceListOrderValues(
              state.descendants as unknown as NestedItemOrderableChildClientStateType[],
              true,
            ) as unknown as Draft<C>[];
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        updateDescendantDraft: (itemData: NestedItemDescendantDataUntypedType) =>
          set((state) => {
            state.descendantDraft = {
              ...(state.descendantDraft as NestedItemDescendantDataType<C>),
              ...(itemData as NestedItemDescendantDataType<C>),
            } as Draft<NestedItemDescendantDataType<C>>;
            // Update the modification timestamp
            state.lastModified = new Date();
          }),
        commitDescendantDraft: () => {
          // Generate a new clientId
          const clientId = getItemId();

          set((state) => {
            // Create a copy of the draft
            const itemData = {
              ...(state.descendantDraft as NestedItemDescendantDataType<C>),
            } as NestedItemDescendantDataType<C>;

            // Construct the new item
            const newItem = {
              clientId,
              createdAt: new Date(),
              lastModified: new Date(),
              disposition: NestedItemDisposition.New,
              ...itemData,
            } as unknown as Draft<C>;

            // Append it to the end of the store's `descendants` array
            state.descendants = state.descendants.length ? [...state.descendants, newItem] : ([newItem] as Draft<C>[]);

            // Update the modification timestamp
            state.lastModified = new Date();

            // Reset the draft
            state.descendantDraft = {} as Draft<NestedItemDescendantDataType<C>>;
          });
        },
        updateStoreWithServerData: (
          serverState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>,
        ) => {
          if (logUpdateFromServer) {
            logUpdateStoreWithServerData(
              get() as NestedItemRecursiveStore<
                NestedItemDescendantClientStateType,
                NestedItemDescendantClientStateType
              >,
              serverState,
            );
          }
          set((state) => {
            const updatedState = handleNestedItemListFromServer(state, serverState);
            if (updatedState === null) {
              console.log(`No updated`);
            }
          });
        },
      })),
      { name: storeName, version: storeVersion /*, storage: createTypesafeLocalstorage<I, C>()*/ },
    ),
  );
};
