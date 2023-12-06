// @/actions/syncNestedItem.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { NestedItemState, NestedItemStore } from "@/stores/nestedItemStore/createNestedItemStore";
import {
  NestedItemClientToServerType,
  NestedItemDescendantClientStateType,
  NestedItemListType,
  NestedItemServerStateType,
  NestedItemServerToClientType,
  getModelAccessor,
  keepOnlyFieldsForCreate,
  keepOnlyFieldsForUpdate,
} from "@/types/nestedItem";
import { Prisma, PrismaClient } from "@prisma/client";
import { getItemLastModified, getItemsByParentId, getNestedItemList, softDeleteAndCascadeItem } from "./nestedItem";

export async function handleNestedItemListFromClient(
  clientState: NestedItemState<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>,
): Promise<NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType> | null> {
  if (!clientState.parentId) {
    throw Error(`handleNestedItemListFromClient: invalid parentId=${clientState.parentId}`);
  }
  const parentId = clientState.parentId;
  const itemModel = clientState.itemModel;
  const descendantModel = clientState.descendantModel;

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
      const clientChildren = existingItem.descendants;

      // The descendants covered by the client are set to the clientLastModified timestamp
      const lastModified = clientLastModified;

      const updatedNestedItemState: NestedItemListType<NestedItemServerToClientType, NestedItemServerToClientType> =
        await prisma.$transaction(async (prisma) => {
          // Process both the properties of the current item and its descendants
          const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);

          // Update current item properties
          await prismaItemModelInstance.update({
            where: { id },
            data: keepOnlyFieldsForUpdate<NestedItemClientToServerType>(existingItem, currentTimestamp),
          });

          let descendantsAfterUpdate: Array<NestedItemServerStateType> =
            clientChildren as Array<NestedItemServerStateType>;

          if (descendantModel) {
            const prismaChildModelInstance = getModelAccessor(descendantModel, prisma as PrismaClient);
            // Process each child for update or creation
            const childPromises = clientChildren.map(
              async (
                child:
                  | NestedItemDescendantClientStateType
                  | NestedItemStore<NestedItemDescendantClientStateType, NestedItemDescendantClientStateType>,
              ) => {
                const childWithParentId = { ...child, parentId: id };
                try {
                  if (child.id) {
                    // Update or soft delete existing child
                    if (child.deletedAt !== null) {
                      console.log(`Soft deleting and cascading child with id=${child.id}`);
                      await softDeleteAndCascadeItem(descendantModel, child.id, prisma as PrismaClient);
                      ++serverItemsDeleted;
                    } else {
                      const data = keepOnlyFieldsForUpdate<NestedItemClientToServerType>(
                        childWithParentId,
                        lastModified,
                      );
                      console.log(
                        `handleNestedItemListFromClient: child.id=${child.id}: update child with data:`,
                        data,
                      );
                      return await prismaChildModelInstance.update({
                        where: { id: child.id },
                        data,
                      });
                    }
                  } else {
                    const data = keepOnlyFieldsForCreate<NestedItemClientToServerType>(
                      childWithParentId,
                      id,
                      lastModified,
                    );

                    console.log(
                      `handleNestedItemListFromClient: client sent an child without "id": create new child with data:`,
                      data,
                    );
                    const createdItem = await prismaChildModelInstance.create({
                      data,
                    });
                    console.log(`handleNestedItemListFromClient: createdItem:`, createdItem);
                    ++serverItemsCreated;
                    return createdItem;
                  }
                } catch (error) {
                  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    // Ignore not found error
                    console.log(`Item with id ${child.id} not found. Ignoring update.`);
                    ++ghostItemsDetected;
                  } else {
                    throw error; // Re-throw other errors
                  }
                }
              },
            );

            await Promise.all(childPromises);

            // Fetch updated descendants to ensure we include only existing ones
            descendantsAfterUpdate = await getItemsByParentId(descendantModel, id, prisma as PrismaClient);

            console.log(
              `handleNestedItemListFromClient: client update with clientTimestamp=${dateToISOLocal(
                clientLastModified,
              )} applied:\n${clientChildren
                .map((a: NestedItemDescendantClientStateType) => a.id?.substring(0, 3))
                .join(", ")}\n.findMany returned ${descendantsAfterUpdate.length} descendants:\n${descendantsAfterUpdate
                .map((a: NestedItemServerStateType) => a.id?.substring(0, 3))
                .join(", ")}\n`,
            );

            let clientChildrenComplete = true;
            const serverChildrenUnmodified =
              ghostItemsDetected == 0 && serverItemsCreated == 0 && serverItemsDeleted == 0;

            // Only if no changes have been made to the server state do we need to check if
            // the list of descendants from the client contained all the descendants on the server
            if (serverChildrenUnmodified) {
              // Compare server descendants with client descendants
              const clientItemIds = new Set(clientChildren.map((a) => a.id));
              clientChildrenComplete = descendantsAfterUpdate.every((serverItem: NestedItemServerStateType) =>
                clientItemIds.has(serverItem.id),
              );
            }

            // Determine if the client is up to date
            clientIsUpToDate = serverChildrenUnmodified && clientChildrenComplete;
          }

          // Assign the final timestamp to that of the client if the client is up to data
          // Otherwise, use the current time to update both server and client lastModified timestamp
          const finalLastModified = clientIsUpToDate ? clientLastModified : currentTimestamp;

          if (clientIsUpToDate) {
            console.log(
              "handleNestedItemListFromClient: server updated to match client state:\n",
              `update item ${itemModel} lastModified from ${dateToISOLocal(
                serverLastModified,
              )} to clientLastModified=${dateToISOLocal(finalLastModified)}`,
            );
          } else {
            console.log(
              "handleNestedItemListFromClient: server and client state merged:\n",
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
    const itemData = keepOnlyFieldsForUpdate<NestedItemClientToServerType>(
      { ...clientState, parentId },
      clientLastModified,
    );
    console.log(`handleNestedItemListFromClient: parentId=${parentId}: create item with itemData:`, itemData);
    const prismaItemModelInstance = getModelAccessor(itemModel, prisma as PrismaClient);
    return await prismaItemModelInstance.create({
      itemData,
    });
  }

  return null;
}
