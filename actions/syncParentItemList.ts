// @/actions/syncParentItemList.ts

"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { ItemClientToServerType, ItemServerToClientType } from "@/types/item";
import {
  ParentItemListStoreNameType,
  ParentItemListType,
  getModelAccessor,
  getParentModel,
  keepOnlyFieldsForCreate,
  keepOnlyFieldsForUpdate,
} from "@/types/parentItemList";
import { Prisma, PrismaClient } from "@prisma/client";
import { getItemLastModified, getItemList, getParentItemList, softDeleteAndCascadeItem } from "./parentItemList";

export async function handleParentItemListFromClient(
  // Item model in Prisma, e.g., 'achievement', 'role'
  model: ParentItemListStoreNameType,
  clientList: ParentItemListType<ItemClientToServerType, ItemClientToServerType>,
): Promise<ParentItemListType<ItemServerToClientType, ItemServerToClientType> | null> {
  const parent = clientList.parent;
  const parentModel = getParentModel(model);

  if (!parentModel) {
    throw Error(
      `handleParentItemListFromClient(model=${model}, parent=${JSON.stringify(parent)}): no parent model for ${model}`,
    );
  }

  if (!clientList.parent) {
    throw Error(`handleParentItemListFromClient(model=${model}, parent is ${parent})`);
  }

  const currentTimestamp = new Date();
  const clientLastModified =
    clientList.parent.lastModified < currentTimestamp ? clientList.parent.lastModified : currentTimestamp;

  const parentId = parent.id!;
  let serverLastModified = await getItemLastModified(parentModel, parentId);
  serverLastModified =
    serverLastModified > currentTimestamp ? new Date(currentTimestamp.getTime() + 1) : serverLastModified;

  if (clientLastModified > serverLastModified) {
    // Detect if the client has any items not present on the server
    let ghostItemsDetected = 0;

    // Track items deleted on the server to indicate to the client
    // that it can remove those as well
    let serverItemsCreated = 0;

    // Track items deleted on the server to indicate to the client
    // that it can remove those as well
    let serverItemsDeleted = 0;

    // Incorporate all changes from the client into the server's state
    const clientItems = clientList.items;

    // The items covered by the client are set to the clientLastModified timestamp
    const lastModified = clientLastModified;
    const updatedList = await prisma.$transaction(async (prisma) => {
      const prismaItemModelInstance = getModelAccessor(model, prisma as PrismaClient); // Type assertion
      const prismaParentModelInstance = getModelAccessor(parentModel, prisma as PrismaClient); // Type assertion
      // Process each item for update or creation
      const itemPromises = clientItems.map(async (item) => {
        try {
          if (item.id) {
            if (item.deletedAt !== null) {
              console.log(`Soft deleting and cascading item with id=${item.id}`);
              await softDeleteAndCascadeItem(model, item.id, prisma as PrismaClient);
              ++serverItemsDeleted;
            } else {
              const data = keepOnlyFieldsForUpdate<ItemClientToServerType>(item, lastModified);
              console.log(`handleParentItemListFromClient: item.id=${item.id}: update item with data:`, data);
              return await prismaItemModelInstance.update({
                where: { id: item.id },
                data,
              });
            }
          } else {
            const data = keepOnlyFieldsForCreate<ItemClientToServerType>(item, parentId, lastModified);

            console.log(
              `handleParentItemListFromClient: client sent an item without "id": create new item with data:`,
              data,
            );
            const createdItem = await prismaItemModelInstance.create({
              data,
            });
            console.log(`handleParentItemListFromClient: createdItem:`, createdItem);
            ++serverItemsCreated;
            return createdItem;
          }
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            // Ignore not found error
            console.log(`Item with id ${item.id} not found. Ignoring update.`);
            ++ghostItemsDetected;
          } else {
            throw error; // Re-throw other errors
          }
        }
      });

      await Promise.all(itemPromises);

      // Fetch updated items to ensure we include only existing ones
      const itemsAfterUpdate = await getItemList(model, parentId, prisma as PrismaClient);

      console.log(
        `handleParentItemListFromClient: client update with clientTimestamp=${dateToISOLocal(
          clientLastModified,
        )} applied:\n${clientItems.map((a) => a.id?.substring(0, 3)).join(", ")}\n.findMany returned ${
          itemsAfterUpdate.length
        } items:\n${itemsAfterUpdate.map((a: ItemClientToServerType) => a.id?.substring(0, 3)).join(", ")}\n`,
      );

      let clientItemsComplete = true;
      const serverStateUntouched = ghostItemsDetected == 0 && serverItemsCreated == 0 && serverItemsDeleted == 0;

      // Only if no changes have been made to the server state do we need to check if
      // the list of items from the client contained all the items on the server
      if (serverStateUntouched) {
        // Compare server items with client items
        const clientItemIds = new Set(clientItems.map((a) => a.id));
        clientItemsComplete = itemsAfterUpdate.every((serverItem: ItemClientToServerType) =>
          clientItemIds.has(serverItem.id),
        );
      }

      // Determine if the client is up to date
      const clientIsUpToDate = serverStateUntouched && clientItemsComplete;

      // Assign the final timestamp to that of the client if the client is up to data
      // Otherwise, use the current time to update both server and client lastModified timestamp
      const finalLastModified = clientIsUpToDate ? clientLastModified : currentTimestamp;

      if (clientIsUpToDate) {
        console.log(
          "handleParentItemListFromClient: server updated to match client state:\n",
          `update parent ${parentModel} lastModified from ${dateToISOLocal(
            serverLastModified,
          )} to clientLastModified=${dateToISOLocal(finalLastModified)}`,
        );
      } else {
        console.log(
          "handleParentItemListFromClient: server and client state merged:\n",
          `update parent ${parentModel} lastModified from ${dateToISOLocal(
            serverLastModified,
          )} to currentTimestamp=${dateToISOLocal(finalLastModified)}`,
        );
      }

      // Update the lastModified timestamp of the parent
      await prismaParentModelInstance.update({
        where: { id: parentId },
        data: { lastModified: finalLastModified },
      });

      return {
        ...clientList,
        lastModified: finalLastModified,
        items: itemsAfterUpdate,
      };
    });

    return updatedList as ParentItemListType<ItemServerToClientType, ItemServerToClientType>;
  } else if (clientLastModified < serverLastModified) {
    return getParentItemList(model, parentId);
  }

  return null;
}
