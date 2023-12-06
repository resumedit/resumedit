// @/actions/syncItemDescendant.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { UserInputType } from "@/schemas/user";
import {
  ItemDescendantClientStateType,
  ItemDescendantServerStateType,
  ItemDescendantStore,
  ItemServerToClientDescendantListType,
} from "@/stores/itemDescendantStore/createItemDescendantStore";
import { ItemClientStateType, ItemClientToServerType, ItemServerToClientType } from "@/types/item";
import {
  getDescendantModel,
  getModelAccessor,
  keepOnlyFieldsForCreate,
  keepOnlyFieldsForUpdate,
} from "@/types/itemDescendant";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  getItemDescendantList,
  getItemLastModified,
  getItemsByParentId,
  softDeleteAndCascadeItem,
} from "./itemDescendant";

export async function handleItemDescendantListFromClient(
  clientState: ItemDescendantClientStateType<ItemClientStateType, ItemClientStateType>,
): Promise<ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType> | null> {
  const itemModel = clientState.itemModel;
  const descendantModel = getDescendantModel(itemModel);

  const currentTimestamp = new Date();
  const clientLastModified = clientState.lastModified < currentTimestamp ? clientState.lastModified : currentTimestamp;

  if (clientState.id) {
    const existingItem = {
      ...clientState,
      id: clientState.id!,
      parentId: clientState.parentId!,
    };
    const id = existingItem.id!;
    const serverLastModified = await getItemLastModified(itemModel, id);

    // Process logic only if the client state is more recent
    if (!serverLastModified || clientLastModified > serverLastModified) {
      let clientIsUpToDate = true;

      // Detect if the client has any descendants not present on the server
      let ghostItemsDetected = 0;

      // Track descendants from client whose `lastModified` timestamp
      // is invalid or older than the one of the server
      let clientItemsStaleOrInvalid = 0;

      // Track descendants deleted on the server to indicate to the client
      // that it can remove those as well
      let serverItemsCreated = 0;

      // Track descendants deleted on the server to indicate to the client
      // that it can remove those as well
      let serverItemsDeleted = 0;

      // Incorporate all changes from the client into the server's state
      const clientDescendants = existingItem.descendants;

      // The descendants covered by the client are set to the clientLastModified timestamp
      const lastModified = clientLastModified;

      const updatedItemDescendantState: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType> =
        await prisma.$transaction(async (prisma) => {
          // Process both the properties of the current item and its descendants
          const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);

          // The `User` model requires special treatment
          if (itemModel === "user") {
            const { id, email, firstName, lastName } = clientState as unknown as UserInputType;
            const data = { id, email, firstName, lastName };
            await prismaItemModelInstance.update({
              where: { id },
              data,
            });
          } else {
            // Update current item properties
            await prismaItemModelInstance.update({
              where: { id },
              data: keepOnlyFieldsForUpdate<ItemClientToServerType>(existingItem, currentTimestamp),
            });
          }
          let descendantsAfterUpdate = clientDescendants as ItemServerToClientDescendantListType<
            ItemServerToClientType,
            ItemServerToClientType
          >;
          let descendantsCreatedByThisClient: ItemServerToClientDescendantListType<
            ItemServerToClientType,
            ItemServerToClientType
          > = [];

          if (descendantModel) {
            const prismaDescendantModelInstance = getModelAccessor(descendantModel, prisma as PrismaClient);
            // Process each descendant for update or creation
            const descendantPromises = clientDescendants.map(
              async (
                descendant: ItemClientStateType | ItemDescendantStore<ItemClientStateType, ItemClientStateType>,
              ) => {
                const descendantWithParentId = { ...descendant, parentId: id };
                try {
                  if (descendant.id) {
                    // Only apply client data if it is more recent than the database
                    const serverModified = await getItemLastModified(descendantModel, descendant.id);
                    // Update or soft delete existing descendant if this deletion happened later than the last modification
                    if (
                      descendant.deletedAt &&
                      descendant.deletedAt instanceof Date &&
                      descendant.lastModified &&
                      descendant.lastModified instanceof Date &&
                      descendant.deletedAt >= descendant.lastModified &&
                      (!serverModified || descendant.deletedAt > serverModified)
                    ) {
                      console.log(`Soft deleting and cascading descendant with id=${descendant.id}`);
                      await softDeleteAndCascadeItem(descendantModel, descendant.id, prisma as PrismaClient);
                      ++serverItemsDeleted;
                    } else {
                      // Only consider client data if its timestamp looks sane
                      if (descendant.lastModified && descendant.lastModified instanceof Date) {
                        if (!serverModified || descendant.lastModified > serverModified) {
                          const data = keepOnlyFieldsForUpdate<ItemClientToServerType>(
                            descendantWithParentId,
                            lastModified,
                          );
                          console.log(
                            `handleItemDescendantListFromClient: descendant.id=${descendant.id}: update descendant with data:`,
                            data,
                          );
                          return await prismaDescendantModelInstance.update({
                            where: { id: descendant.id },
                            data,
                          });
                        } else {
                          ++clientItemsStaleOrInvalid;
                        }
                      } else {
                        console.log(
                          `handleItemDescendantListFromClient: descendant.id=${descendant.id}: invalid lastModified timestamp:`,
                          descendant.lastModified,
                        );
                        ++clientItemsStaleOrInvalid;
                      }
                    }
                  } else {
                    const data = keepOnlyFieldsForCreate<ItemClientToServerType>(
                      descendantWithParentId,
                      id,
                      lastModified,
                    );

                    console.log(
                      `handleItemDescendantListFromClient: client sent an descendant without "id": create new descendant with data:`,
                      data,
                    );
                    const createdItem = await prismaDescendantModelInstance.create({
                      data,
                    });
                    ++serverItemsCreated;
                    const clientResponseItem = { ...createdItem, clientId: descendantWithParentId.clientId };
                    console.log(`handleItemDescendantListFromClient: clientResponseItem:`, clientResponseItem);
                    descendantsCreatedByThisClient = [...descendantsCreatedByThisClient, clientResponseItem];
                    return createdItem;
                  }
                } catch (error) {
                  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    // Ignore not found error
                    console.log(`Item with id ${descendant.id} not found. Ignoring update.`);
                    ++ghostItemsDetected;
                  } else {
                    throw error; // Re-throw other errors
                  }
                }
              },
            );

            await Promise.all(descendantPromises);

            // Fetch updated descendants to ensure we include only existing ones
            descendantsAfterUpdate = await getItemsByParentId(descendantModel, id, prisma as PrismaClient);

            // Replace the descendants created by the client to include the clientId
            descendantsAfterUpdate = descendantsAfterUpdate.map((descendant) => {
              return (
                descendantsCreatedByThisClient.find((newDescendant) => newDescendant.id === descendant.id) || descendant
              );
            });

            console.log(
              `handleItemDescendantListFromClient: client update with clientTimestamp=${dateToISOLocal(
                clientLastModified,
              )} applied:\n${clientDescendants
                .map((a: ItemClientStateType) => a.id?.substring(0, 7))
                .join(", ")}\n.findMany returned ${descendantsAfterUpdate.length} descendants:\n${descendantsAfterUpdate
                .map(
                  (a: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>) =>
                    a.id?.substring(0, 7),
                )
                .join(", ")}\n`,
            );

            let clientDescendantsComplete = true;
            const serverDescendantsUnmodified =
              ghostItemsDetected == 0 &&
              clientItemsStaleOrInvalid == 0 &&
              serverItemsCreated == 0 &&
              serverItemsDeleted == 0;

            // Only if no changes have been made to the server state do we need to check if
            // the list of descendants from the client contained all the descendants on the server
            if (serverDescendantsUnmodified) {
              // Compare server descendants with client descendants
              const clientItemIds = new Set(clientDescendants.map((a) => a.id));
              clientDescendantsComplete = descendantsAfterUpdate.every(
                (serverItem: ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>) =>
                  clientItemIds.has(serverItem.id),
              );
            }

            // Determine if the client is up to date
            clientIsUpToDate = serverDescendantsUnmodified && clientDescendantsComplete;
          }

          // Assign the final timestamp to that of the client if the client is up to data
          // Otherwise, use the current time to update both server and client lastModified timestamp
          const finalLastModified = clientIsUpToDate ? clientLastModified : currentTimestamp;

          if (clientIsUpToDate) {
            console.log(
              "handleItemDescendantListFromClient: server updated to match client state:\n",
              `update item ${itemModel} lastModified from ${dateToISOLocal(
                serverLastModified,
              )} to clientLastModified=${dateToISOLocal(finalLastModified)}`,
            );
          } else {
            console.log(
              "handleItemDescendantListFromClient: server and client state merged:\n",
              `update item ${itemModel} lastModified from ${dateToISOLocal(
                serverLastModified,
              )} to currentTimestamp=${dateToISOLocal(finalLastModified)}`,
            );
          }

          // Update the lastModified timestamp of the item
          await prismaItemModelInstance.update({
            where: { id: id },
            data: { lastModified: finalLastModified },
          });

          return {
            ...existingItem,
            lastModified: finalLastModified,
            descendants: descendantsAfterUpdate,
          } as ItemDescendantServerStateType<ItemServerToClientType, ItemServerToClientType>;
        });

      return updatedItemDescendantState;
    } else if (clientLastModified < serverLastModified) {
      return getItemDescendantList(itemModel, existingItem.id!);
    } else {
      return null;
    }
  } else {
    // Create item
    const parentId = clientState.parentId!;
    const itemData = keepOnlyFieldsForUpdate<ItemClientToServerType>({ ...clientState, parentId }, clientLastModified);
    console.log(`handleItemDescendantListFromClient: parentId=${parentId}: create item with itemData:`, itemData);
    const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);
    return await prismaItemModelInstance.create({
      itemData,
    });
  }
}
