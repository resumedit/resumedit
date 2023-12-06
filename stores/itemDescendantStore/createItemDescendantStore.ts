// @/stores/itemDescendant/createItemDescendantStore.ts
import { IdSchemaType, getClientId } from "@/schemas/id";
import { ItemClientStateType, ItemDataType, ItemDataUntypedType, ItemOrderableClientStateType } from "@/schemas/item";
import {
  ItemDescendantClientStateListType,
  ItemDescendantOrderableStoreStateType,
  ItemDescendantServerStateType,
  ItemDescendantOrderableClientStateListType,
  ItemDescendantOrderableStoreStateListType,
  ItemDescendantStoreStateListType,
  itemDescendantOrderableStoreStateSchema,
  itemDescendantStoreStateSchema,
} from "@/schemas/itemDescendant";
import { ClientIdType, ItemDisposition } from "@/types/item";
import { ItemDescendantModelNameType, createDateSafeLocalstorage, getDescendantModel } from "@/types/itemDescendant";
import { Draft } from "immer";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  getOrderValueForAppending,
  reBalanceListOrderValues,
  updateListOrderValues,
} from "./utils/descendantOrderValues";
import { handleNestedItemDescendantListFromServer } from "./utils/syncItemDescendantStore";
import { siteConfig } from "@/config/site";

// NOTE: This type must be kept in sync with `ItemClientStateType`, which is
// inferred using the Zod schemas in `@/schemas/itemDescendant`
export type ItemClientState = {
  createdAt: Date;
  lastModified: Date;
  deletedAt: Date | null;
  parentClientId: ClientIdType;
  clientId: ClientIdType;
  id?: IdSchemaType;
  parentId?: IdSchemaType;
  disposition: ItemDisposition;
};

// NOTE: This type must be kept in sync with `ItemDescendantClientStateListType`, which is
// inferred using the Zod schemas in `@/schemas/itemDescendant`
export type ItemDescendantClientStateList = Array<ItemDescendantClientState>;
export type ItemDescendantClientState = ItemClientStateType & {
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantClientStateList;
};

// NOTE: This type must be kept in sync with `ItemDescendantStoreStateType`, which is
// inferred using the Zod schemas in `@/schemas/itemDescendant`
export type ItemDescendantStoreState = {
  createdAt: Date;
  lastModified: Date;
  deletedAt: Date | null;
  parentClientId: ClientIdType;
  clientId: ClientIdType;
  id?: string | undefined;
  parentId?: string | undefined;
  disposition: ItemDisposition;
  itemModel: ItemDescendantModelNameType;
  descendantModel: ItemDescendantModelNameType | null;
  descendants: ItemDescendantClientStateListType;
  descendantDraft: ItemDataUntypedType;
};

export type ItemDescendantStoreActions = {
  setItemData: (data: ItemDataUntypedType, clientId: ClientIdType) => void;
  markItemAsDeleted: (clientId: ClientIdType) => void;
  restoreDeletedItem: (clientId: ClientIdType) => void;
  getDescendants: (ancestorClientIds: Array<ClientIdType>) => ItemDescendantClientStateListType;
  setDescendantData: (
    descendantData: ItemDataUntypedType,
    clientId: ClientIdType,
    ancestorClientIds: Array<ClientIdType>,
  ) => void;
  // addDescendant: (descendantData: ItemDataUntypedType) => void; // FIXME: Untested
  markDescendantAsDeleted: (clientId: ClientIdType, ancestorClientIds: Array<ClientIdType>) => void;
  reArrangeDescendants: (
    reArrangedDescendants: ItemDescendantClientStateListType,
    ancestorClientIds: Array<ClientIdType>,
  ) => void;
  resetDescendantsOrderValues: (ancestorClientIds: Array<ClientIdType>) => void;
  getDescendantDraft: (ancestorClientIds: Array<ClientIdType>) => ItemDataUntypedType;
  updateDescendantDraft: (descendantData: ItemDataUntypedType, ancestorClientIds: Array<ClientIdType>) => void;
  commitDescendantDraft: (ancestorClientIds: Array<ClientIdType>) => void;
  updateStoreWithServerData: (serverState: ItemDescendantServerStateType) => void;
};

export type ItemDescendantStore = ItemDescendantStoreState & ItemDescendantStoreActions;

// Selector type is used to type the return type when using the store with a selector
type ItemDescendantSelectorType<T> = (state: ItemDescendantStore) => T;

// Hook type is used as a return type when using the store
export type ItemDescendantHookType<T> = (selector?: ItemDescendantSelectorType<T>) => T;

export interface ItemDescendantStoreConfigType {
  itemModel: ItemDescendantModelNameType;

  parentClientId: ClientIdType;
  clientId: ClientIdType;

  parentId: IdSchemaType | undefined;
  id: IdSchemaType | undefined;

  storeVersion?: number;
  storeName?: string;
}
export const storeVersion = 1;
const storeNameSuffix =
  process.env.NODE_ENV === "development" ? `devel.${siteConfig.canonicalDomainName}` : siteConfig.canonicalDomainName;

export function getDescendantFromAncestorChain(
  ancestorStateChain: ItemDescendantStoreStateListType,
  ancestorClientIdChain: Array<ClientIdType>,
  lastModified?: Date,
): ItemDescendantStoreStateListType {
  console.log(
    "getDescendantFromAncestorChain:\n",
    `ancestorStateChain: ${ancestorStateChain.map((item) => item.clientId).join("->")}`,
    "\n",
    `ancestorClientIdChain: ${ancestorClientIdChain.join("->")}`,
  );
  // Descend from the `state` all the way down to the descendant based on the `ancestorClientIdChain` array
  const state = ancestorStateChain[0];
  if (lastModified) {
    state.lastModified = lastModified;
    state.disposition = ItemDisposition.Modified;
  }
  if (ancestorClientIdChain.length === 0) {
    return ancestorStateChain;
  }
  const ancestorClientId = ancestorClientIdChain[ancestorClientIdChain.length - 2];
  const ancestorState = state.descendants.find(
    (descendant) => descendant.clientId === ancestorClientId,
  ) as ItemDescendantStoreState;
  if (ancestorState) {
    if (lastModified) {
      ancestorState.lastModified = lastModified;
      ancestorState.disposition = ItemDisposition.Modified;
    }
    return getDescendantFromAncestorChain(
      [ancestorState, ...ancestorStateChain],
      ancestorClientIdChain.slice(0, -1),
      lastModified,
    );
  }
  return ancestorStateChain;
}

export const createItemDescendantStore = ({
  parentClientId,
  clientId,
  parentId,
  id,
  itemModel,
  storeVersion = 1,
  storeName: customStoreName,
}: ItemDescendantStoreConfigType) => {
  const storeName = customStoreName ? customStoreName : `${itemModel}-${storeNameSuffix}`;

  return create(
    persist(
      immer<ItemDescendantStore>((set, get) => ({
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
        descendantDraft: {} as ItemDataUntypedType,

        setItemData: (descendantData: ItemDataUntypedType): void => {
          set((state) => {
            // Loop through each key in descendantData and update the state
            // Assuming ItemDataUntypedType is a type that can be safely assigned to the state
            Object.entries(descendantData).forEach(([key, value]) => {
              if (key in state) {
                // Type assertion to convince TypeScript about the assignment
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (state as any)[key] = value;
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
            const now = new Date();
            state.deletedAt = new Date(now);

            // Update the modification timestamp to ensure the server picks up the update
            state.lastModified = new Date(now);
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
        getDescendants: (ancestorClientIds: Array<ClientIdType>): ItemDescendantClientStateListType => {
          const ancestorStateChain = getDescendantFromAncestorChain([get()], ancestorClientIds);
          const ancestorState = ancestorStateChain[0];
          return ancestorState.descendants;
        },
        setDescendantData: (
          descendantData: ItemDataUntypedType,
          clientId: ClientIdType,
          ancestorClientIds: Array<ClientIdType>,
        ): void => {
          const now = new Date();
          set((state) => {
            const ancestorStateChain = getDescendantFromAncestorChain([state], ancestorClientIds, new Date(now));
            const ancestorState = ancestorStateChain[0];
            // Update the state with the deletedAt timestamp for the specified descendant
            ancestorState.descendants = ancestorState.descendants.map((descendant) => {
              if (descendant.clientId === clientId) {
                return {
                  ...descendant,
                  ...descendantData,
                  disposition: ItemDisposition.Modified,
                  lastModified: new Date(now),
                };
              }
              return descendant;
            });
          });
        },
        markDescendantAsDeleted: (clientId: ClientIdType, ancestorClientIds: Array<ClientIdType>): void => {
          const now = new Date();
          set((state) => {
            const ancestorStateChain = getDescendantFromAncestorChain([state], ancestorClientIds, new Date(now));
            const ancestorState = ancestorStateChain[0];
            // Update the state with the deletedAt timestamp for the specified descendant
            ancestorState.descendants = ancestorState.descendants.map((descendant) => {
              if (descendant.clientId === clientId) {
                return {
                  ...descendant,
                  disposition: ItemDisposition.Modified,
                  deletedAt: new Date(now),
                  // Update the modification timestamp to ensure the server picks up the update
                  lastModified: new Date(now),
                };
              }
              return descendant;
            });
          });
        },
        reArrangeDescendants: (
          reArrangedDescendants: ItemDescendantOrderableClientStateListType,
          ancestorClientIds: Array<ClientIdType>,
        ): void => {
          set((state) => {
            const ancestorStateChain = getDescendantFromAncestorChain([state], ancestorClientIds, new Date());
            const ancestorState = ancestorStateChain[0];
            // Update the state with the re-ordered descendants
            ancestorState.descendants = updateListOrderValues(
              reArrangedDescendants as unknown as Array<ItemOrderableClientStateType>,
            ) as unknown as Draft<ItemDescendantOrderableStoreStateListType>;
          });
        },
        resetDescendantsOrderValues: (ancestorClientIds: Array<ClientIdType>): void => {
          set((state) => {
            const ancestorStateChain = getDescendantFromAncestorChain([state], ancestorClientIds, new Date());
            const ancestorState = ancestorStateChain[0];
            // Update the state with the descendants having balanced order values
            ancestorState.descendants = reBalanceListOrderValues(
              ancestorState.descendants as unknown as Array<ItemOrderableClientStateType>,
              true,
            ) as unknown as Draft<ItemDescendantOrderableStoreStateListType>;
          });
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getDescendantDraft: (ancestorClientIds: Array<ClientIdType>): ItemDataType<any> => {
          const ancestorStateChain = getDescendantFromAncestorChain([get()], ancestorClientIds);
          const ancestorState = ancestorStateChain[0];
          return ancestorState.descendantDraft;
        },
        updateDescendantDraft: (descendantData: ItemDataUntypedType, ancestorClientIds: Array<ClientIdType>) => {
          set((state) => {
            const ancestorStateChain = getDescendantFromAncestorChain([state], ancestorClientIds);
            // Update the state with the new draft descendant data
            ancestorStateChain[0].descendantDraft = {
              ...(state.descendantDraft as ItemDataUntypedType),
              ...(descendantData as ItemDataUntypedType),
            } as Draft<ItemDataUntypedType>;
          });
        },
        commitDescendantDraft: (ancestorClientIds: Array<ClientIdType>) => {
          set((state) => {
            const ancestorStateChain = getDescendantFromAncestorChain([state], ancestorClientIds, new Date());
            const ancestorState = ancestorStateChain[0];
            const descendantOfDescendantModel = ancestorState.descendantModel
              ? getDescendantModel(ancestorState.descendantModel)
              : null;
            const descendantClientId = getClientId(ancestorState.descendantModel);

            if (!ancestorState.descendantModel) {
              throw Error(
                `commitDescendantDraft: ancestorState has invalid descendantModel: ${JSON.stringify(ancestorState)}`,
              );
            }
            const descendantModel = ancestorState.descendantModel!;

            // Create a copy of the draft
            const descendantData = {
              ...ancestorState.descendantDraft,
              itemModel: descendantModel,
              clientId: descendantClientId,
              parentClientId: ancestorState.clientId,
              parentId: ancestorState.id,
              createdAt: new Date(),
              lastModified: new Date(),
              deletedAt: null,
              disposition: ItemDisposition.New,
              descendantModel: descendantOfDescendantModel,
              descendants: [],
              descendantDraft: {} as Draft<ItemDataUntypedType>,
            };

            let newDescendant;
            // Add the `order` field if the model requires it
            if (["achievement"].includes(descendantModel)) {
              newDescendant = {
                ...descendantData,
                order: getOrderValueForAppending(
                  ancestorState.descendants as unknown as ItemOrderableClientStateType[],
                ),
              } as Draft<ItemDescendantOrderableStoreStateType>;
              itemDescendantOrderableStoreStateSchema.parse(newDescendant);
            } else {
              newDescendant = descendantData;
              itemDescendantStoreStateSchema.parse(newDescendant);
            }

            // Append it to the end of the store's `descendants` array
            ancestorState.descendants = ancestorState.descendants.length
              ? [...ancestorState.descendants, newDescendant]
              : [newDescendant];

            // Reset the draft
            ancestorState.descendantDraft = {} as Draft<ItemDataUntypedType>;
            for (const ancestorState of ancestorStateChain) {
              // Update the modification timestamp of the ancestor
              ancestorState.lastModified = new Date();
            }
          });
        },
        updateStoreWithServerData: (serverState: ItemDescendantServerStateType) => {
          // if (logUpdateFromServer) {
          //   logUpdateStoreWithServerData(
          //     get() as ItemDescendantStore,
          //     serverState,
          //   );
          // }
          set((state) => {
            handleNestedItemDescendantListFromServer(state, serverState);
          });
        },
      })),
      {
        name: storeName,
        version: storeVersion,
        storage: createDateSafeLocalstorage() /*, storage: createTypesafeLocalstorage()*/,
      },
    ),
  );
};
