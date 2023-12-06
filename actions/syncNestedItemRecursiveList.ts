// @/actions/syncNestedItem.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { UserSchemaInput } from "@/schemas/user";
import {
  NestedItemRecursiveState,
  NestedItemRecursiveStore,
} from "@/stores/nestedItemRecursiveStore/createNestedItemRecursiveStore";
import {
  NestedItemClientToServerType,
  NestedItemDescendantClientStateType,
  NestedItemListType,
  NestedItemServerStateType,
  NestedItemServerToClientType,
  getDescendantModel,
  getModelAccessor,
  keepOnlyFieldsForCreate,
  keepOnlyFieldsForUpdate,
} from "@/types/nestedItem";
import { Prisma, PrismaClient } from "@prisma/client";
import { getItemLastModified, getItemsByParentId, getNestedItemList, softDeleteAndCascadeItem } from "./nestedItem";

export async function handleNestedItemRecursiveListFromClient(
  clientState: NestedItemRecursiveState<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>,
): Promise<NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType> | null> {
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
    if (clientLastModified > serverLastModified) {
      let clientIsUpToDate = true;

      // Detect if the client has any descendants not present on the server
      let ghostItemsDetected = 0;

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

      const updatedNestedItemState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType> =
        await prisma.$transaction(async (prisma) => {
          // Process both the properties of the current item and its descendants
          const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);

          // The `User` model requires special treatment
          if (itemModel === "user") {
            const { id, email, firstName, lastName } = clientState as unknown as UserSchemaInput;
            const data = { id, email, firstName, lastName };
            await prismaItemModelInstance.update({
              where: { id },
              data,
            });
          } else {
            // Update current item properties
            await prismaItemModelInstance.update({
              where: { id },
              data: keepOnlyFieldsForUpdate<NestedItemClientToServerType>(existingItem, currentTimestamp),
            });
          }
          let descendantsAfterUpdate: Array<NestedItemServerStateType> =
            clientDescendants as Array<NestedItemServerStateType>;

          if (descendantModel) {
            const prismaDescendantModelInstance = getModelAccessor(descendantModel, prisma as PrismaClient);
            // Process each descendant for update or creation
            const descendantPromises = clientDescendants.map(
              async (
                descendant:
                  | NestedItemDescendantClientStateType
                  | NestedItemRecursiveStore<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>,
              ) => {
                const descendantWithParentId = { ...descendant, parentId: id };
                try {
                  if (descendant.id) {
                    // Update or soft delete existing descendant
                    if (descendant.deletedAt !== null) {
                      console.log(`Soft deleting and cascading descendant with id=${descendant.id}`);
                      await softDeleteAndCascadeItem(descendantModel, descendant.id, prisma as PrismaClient);
                      ++serverItemsDeleted;
                    } else {
                      const data = keepOnlyFieldsForUpdate<NestedItemClientToServerType>(
                        descendantWithParentId,
                        lastModified,
                      );
                      console.log(
                        `handleNestedItemRecursiveListFromClient: descendant.id=${descendant.id}: update descendant with data:`,
                        data,
                      );
                      return await prismaDescendantModelInstance.update({
                        where: { id: descendant.id },
                        data,
                      });
                    }
                  } else {
                    const data = keepOnlyFieldsForCreate<NestedItemClientToServerType>(
                      descendantWithParentId,
                      id,
                      lastModified,
                    );

                    console.log(
                      `handleNestedItemRecursiveListFromClient: client sent an descendant without "id": create new descendant with data:`,
                      data,
                    );
                    const createdItem = await prismaDescendantModelInstance.create({
                      data,
                    });
                    console.log(`handleNestedItemRecursiveListFromClient: createdItem:`, createdItem);
                    ++serverItemsCreated;
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

            console.log(
              `handleNestedItemRecursiveListFromClient: client update with clientTimestamp=${dateToISOLocal(
                clientLastModified,
              )} applied:\n${clientDescendants
                .map((a: NestedItemDescendantClientStateType) => a.id?.substring(0, 3))
                .join(", ")}\n.findMany returned ${descendantsAfterUpdate.length} descendants:\n${descendantsAfterUpdate
                .map((a: NestedItemServerStateType) => a.id?.substring(0, 3))
                .join(", ")}\n`,
            );

            let clientDescendantsComplete = true;
            const serverDescendantsUnmodified =
              ghostItemsDetected == 0 && serverItemsCreated == 0 && serverItemsDeleted == 0;

            // Only if no changes have been made to the server state do we need to check if
            // the list of descendants from the client contained all the descendants on the server
            if (serverDescendantsUnmodified) {
              // Compare server descendants with client descendants
              const clientItemIds = new Set(clientDescendants.map((a) => a.id));
              clientDescendantsComplete = descendantsAfterUpdate.every((serverItem: NestedItemServerStateType) =>
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
              "handleNestedItemRecursiveListFromClient: server updated to match client state:\n",
              `update item ${itemModel} lastModified from ${dateToISOLocal(
                serverLastModified,
              )} to clientLastModified=${dateToISOLocal(finalLastModified)}`,
            );
          } else {
            console.log(
              "handleNestedItemRecursiveListFromClient: server and client state merged:\n",
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
            descendants: descendantsAfterUpdate as NestedItemListType<
              NestedItemServerToClientType,
              NestedItemServerToClientType
            >[],
          } as NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType>;
        });

      return updatedNestedItemState;
    } else if (clientLastModified < serverLastModified) {
      return getNestedItemList(itemModel, existingItem.id!);
    }
  } else {
    // Create item
    const parentId = clientState.parentId!;
    const itemData = keepOnlyFieldsForUpdate<NestedItemClientToServerType>(
      { ...clientState, parentId },
      clientLastModified,
    );
    console.log(`handleNestedItemRecursiveListFromClient: parentId=${parentId}: create item with itemData:`, itemData);
    const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);
    return await prismaItemModelInstance.create({
      itemData,
    });
  }

  return null;
}
