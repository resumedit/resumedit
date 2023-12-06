// @/stores/nestedItem/createNestedItemStore.ts
import { IdSchemaType, getItemId } from "@/schemas/id";
import {
  ClientIdType,
  NestedItemChildClientStateType,
  NestedItemChildDataType,
  NestedItemChildDataUntypedType,
  NestedItemDisposition,
  NestedItemListType,
  NestedItemModelAccessor,
  NestedItemOrderableChildClientStateType,
  NestedItemServerToClientType,
  NestedStoreConfigType,
  // createTypesafeLocalstorage,
  getChildModel,
  getParentModel,
  storeNameSuffix,
  storeVersion,
} from "@/types/nestedItem";
import { Draft } from "immer";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { reBalanceListOrderValues, updateListOrderValues } from "./utils/descendantOrderValues";
import { logUpdateStoreWithServerData } from "./utils/logNestedItemStore";
import { handleNestedItemListFromServer } from "./utils/syncNestedItem";

export type NestedItemStoreDescendantType<
  I extends NestedItemChildClientStateType,
  C extends NestedItemChildClientStateType,
> = C | NestedItemStore<I, C>;

export type NestedItemStoreDescendantListType<
  I extends NestedItemChildClientStateType,
  C extends NestedItemChildClientStateType,
> = Array<NestedItemStoreDescendantType<I, C>>;

export type NestedItemState<I extends NestedItemChildClientStateType, C extends NestedItemChildClientStateType> = {
  clientId: IdSchemaType;
  id: IdSchemaType | undefined;
  parentId: IdSchemaType | undefined;
  createdAt: Date;
  lastModified: Date;
  deletedAt: Date | null;
  disposition: NestedItemDisposition;

  parentModel: keyof NestedItemModelAccessor | null;
  itemModel: keyof NestedItemModelAccessor;
  descendantModel: keyof NestedItemModelAccessor | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descendants: NestedItemStoreDescendantListType<I, C>;
  descendantDraft: NestedItemChildDataType<C>;
};

export type NestedItemActions<C extends NestedItemChildClientStateType> = {
  setChildData: (clientId: ClientIdType, data: NestedItemChildDataUntypedType) => void;
  addDescendant: (itemData: NestedItemChildDataType<C>) => ClientIdType;
  markDescendantAsDeleted: (clientId: ClientIdType) => void;
  reArrangeDescendants: (reArrangedItems: NestedItemOrderableChildClientStateType[]) => void;
  resetDescendantsOrderValues: () => void;
  updateDescendantDraft: (itemData: NestedItemChildDataUntypedType) => void;
  commitDescendantDraft: () => void;
  updateStoreWithServerData: (
    serverState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>,
  ) => void;
};

export type NestedItemStore<
  I extends NestedItemChildClientStateType,
  C extends NestedItemChildClientStateType,
> = NestedItemState<I, C> & NestedItemActions<C>;

// Selector type is used to type the return type when using the store with a selector
type NestedItemSelectorType<I extends NestedItemChildClientStateType, C extends NestedItemChildClientStateType, T> = (
  state: NestedItemStore<I, C>,
) => T;

// Hook type is used as a return type when using the store
export type NestedItemHookType = <
  I extends NestedItemChildClientStateType,
  C extends NestedItemChildClientStateType,
  T,
>(
  selector?: NestedItemSelectorType<I, C, T>,
) => T;

export const createNestedItemStore = <
  I extends NestedItemChildClientStateType,
  C extends NestedItemChildClientStateType,
>(
  props: NestedStoreConfigType,
) => {
  const parentId = props.parentId;
  const id = props.id;
  const clientId = props.clientId;
  const itemModel = props.itemModel;
  // Retrieve the parent model
  const descendantModel = getParentModel(props.itemModel);
  const storeName = `${itemModel}-${storeNameSuffix}`;

  return create(
    persist(
      immer<NestedItemStore<I, C>>((set, get) => ({
        parentId,
        id,
        clientId,
        createdAt: new Date(),
        lastModified: new Date(),
        deletedAt: null,
        disposition: NestedItemDisposition.New,

        parentModel: getParentModel(itemModel),
        itemModel: itemModel,
        descendantModel: descendantModel,
        descendants: [],
        descendantDraft: {} as C,

        setItemData: (itemData: NestedItemChildDataUntypedType): void => {
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
        addDescendant: (itemData: NestedItemChildDataType<C>) => {
          const descendantClientId = getItemId();
          const descendantModel = getChildModel(itemModel);
          set((state) => {
            let newItem;
            if (descendantModel) {
              // Create the nested store of type C
              const descendantStoreProps: NestedStoreConfigType = {
                parentId: id,
                id: undefined,
                clientId: descendantClientId,
                itemModel: descendantModel,
              };
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const descendantStore = createNestedItemStore<C, any>(descendantStoreProps);
              newItem = descendantStore as unknown as Draft<NestedItemStore<I, C>>;
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
          // Update the state with the deletedAt timestamp for the specified item
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
        setChildData: (clientId: ClientIdType, itemData: NestedItemChildDataUntypedType): void => {
          // Update the state with the new content for the specified item
          set((state) => {
            state.descendants = state.descendants.map((item) => {
              if (item.clientId === clientId) {
                return { ...item, ...itemData, disposition: NestedItemDisposition.Modified, lastModified: new Date() };
              }
              return item;
            });
            // Update the modification timestamp
            state.lastModified = new Date();
          });
        },
        updateDescendantDraft: (itemData: NestedItemChildDataUntypedType) =>
          set((state) => {
            state.descendantDraft = {
              ...(state.descendantDraft as NestedItemChildDataType<C>),
              ...(itemData as NestedItemChildDataType<C>),
            } as Draft<NestedItemChildDataType<C>>;
            // Update the modification timestamp
            state.lastModified = new Date();
          }),
        commitDescendantDraft: () => {
          // Generate a new clientId
          const clientId = getItemId();

          set((state) => {
            // Create a copy of the draft
            const itemData = { ...(state.descendantDraft as NestedItemChildDataType<C>) } as NestedItemChildDataType<C>;

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
            state.descendantDraft = {} as Draft<NestedItemChildDataType<C>>;
          });
        },
        updateStoreWithServerData: (
          serverState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>,
        ) => {
          if (props.logUpdateFromServer) {
            logUpdateStoreWithServerData(
              get() as NestedItemStore<NestedItemChildClientStateType, NestedItemChildClientStateType>,
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
