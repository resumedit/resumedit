"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { ItemClientToServerType, ItemDisposition, ItemServerToClientType } from "@/types/item";
import {
  ParentItemListStoreNameType,
  ParentItemListType,
  getModelAccessor,
  getParentModel,
  keepOnlyFieldsForCreate,
  keepOnlyFieldsForUpdate,
} from "@/types/parentItemList";
import { ModificationTimestampType } from "@/types/timestamp";
import { Prisma, PrismaClient } from "@prisma/client";

export async function getListLastModifiedById(
  parentModel: ParentItemListStoreNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
) {
  const prismaClient = prismaTransaction || prisma;
  const prismaParentModelInstance = getModelAccessor(parentModel, prismaClient);
  const item = await prismaParentModelInstance.findUnique({
    where: { id: parentId },
    select: { lastModified: true },
  });
  return item?.lastModified;
}

export async function getItemList(
  model: ParentItemListStoreNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
) {
  const prismaClient = prismaTransaction || prisma;
  const prismaItemModelInstance = getModelAccessor(model, prismaClient);
  // Retrieve the items
  const items = await prismaItemModelInstance.findMany({
    where: { parentId },
    orderBy: { lastModified: "desc" },
  });

  return items;
}

export async function getParentItemList(
  model: ParentItemListStoreNameType,
  parentId: IdSchemaType,
  prismaTransaction?: PrismaClient,
) {
  const parentModel = getParentModel(model);

  // Function to execute the logic, using either an existing transaction or a new prisma client
  const executeLogic = async (prismaClient: PrismaClient) => {
    const lastModified = await getListLastModifiedById(parentModel, parentId, prismaClient);

    if (!lastModified) throw new Error(`${parentModel} with ID ${parentId} not found.`);

    const items = await getItemList(model, parentId, prismaClient);

    return {
      parentId,
      lastModified,
      items,
    };
  };

  // If a transaction is provided, use it directly without starting a new transaction
  if (prismaTransaction) {
    return executeLogic(prismaTransaction);
  } else {
    // If no transaction is provided, start a new one
    return prisma.$transaction(async (prismaClient) => {
      // In Prisma, when you initiate a transaction using prisma.$transaction, the argument it provides
      // to the callback is not a full PrismaClient instance. It's a subset of PrismaClient with
      // certain methods omitted, specifically the ones related to managing the connection and
      // transactions themselves. As Prisma does not provide the types for a clean solution,
      //  we cast the limited client returned in the argument into a PrismaClient
      return executeLogic(prismaClient as unknown as PrismaClient);
    });
  }
}

export async function handleParentItemListFromClient(
  // Item model in Prisma, e.g., 'achievement', 'role'
  model: ParentItemListStoreNameType,
  clientList: ParentItemListType<ItemClientToServerType>,
): Promise<ParentItemListType<ItemServerToClientType> | null> {
  const parentId = clientList.parentId;
  const parentModel = getParentModel(model);
  const currentTimestamp = new Date();
  const clientLastModified = clientList.lastModified < currentTimestamp ? clientList.lastModified : currentTimestamp;

  let serverLastModified = await getListLastModifiedById(parentModel, parentId);
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
            if (item.disposition === ItemDisposition.Deleted) {
              console.log(
                `mergeClientParentItemListWithServer: item.id=${item.id} disposition=${item.disposition}: delete item`,
              );
              await prismaItemModelInstance.delete({
                where: { id: item.id },
              });
              ++serverItemsDeleted;
            } else {
              const data = keepOnlyFieldsForUpdate<ItemClientToServerType>(item, lastModified);
              console.log(`mergeClientParentItemListWithServer: item.id=${item.id}: update item with data:`, data);
              return await prismaItemModelInstance.update({
                where: { id: item.id },
                data,
              });
            }
          } else {
            const data = keepOnlyFieldsForCreate<ItemClientToServerType>(item, parentId, lastModified);

            console.log(
              `mergeClientParentItemListWithServer: client sent an item without "id": create new item with data:`,
              data,
            );
            const createdItem = await prismaItemModelInstance.create({
              data,
            });
            console.log(`mergeClientParentItemListWithServer: createdItem:`, createdItem);
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
        `mergeClientParentItemListWithServer: client update with clientTimestamp=${dateToISOLocal(
          clientLastModified,
        )} applied:\n${clientItems.map((a) => a.id?.substring(0, 3)).join(", ")}\n.findMany returned ${
          itemsAfterUpdate.length
        } items:\n${itemsAfterUpdate.map((a: ItemClientToServerType) => a.id?.substring(0, 3)).join(", ")}\n`,
      );

      let clientItemsIncomplete = false;
      if (ghostItemsDetected == 0 && serverItemsCreated == 0 && serverItemsDeleted == 0) {
        // Compare server items with client items
        const clientItemIds = new Set(clientItems.map((a) => a.id));
        clientItemsIncomplete = !itemsAfterUpdate.every((serverItem: ItemClientToServerType) =>
          clientItemIds.has(serverItem.id),
        );
      }
      const clientNeedsUpdate = ghostItemsDetected || serverItemsCreated || serverItemsDeleted || clientItemsIncomplete;
      // Determine the lastModified timestamp based on the comparison
      const finalLastModified = clientNeedsUpdate ? currentTimestamp : clientLastModified;

      console.log(
        `mergeClientParentItemListWithServer: update role lastModified from server=${dateToISOLocal(
          serverLastModified,
        )} to finalLastModified=${dateToISOLocal(finalLastModified)}`,
      );

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

    return updatedList as ParentItemListType<ItemServerToClientType> | null;
  } else if (clientLastModified < serverLastModified) {
    return getParentItemList(parentModel, parentId);
  }

  return null;
}

export async function mergeClientListWithServer<T extends ItemClientToServerType, U extends ItemServerToClientType>(
  clientList: ParentItemListType<T>,
  getListLastModifiedById: (parentId: IdSchemaType) => Promise<ModificationTimestampType>,
  getList: (parentId: IdSchemaType) => Promise<ParentItemListType<U>>,
  // Item model in Prisma, e.g., 'achievement', 'role'
  model: ParentItemListStoreNameType,
  // Parent model in Prisma that contains the list of the item model, .g., 'role', 'organization'
  parentModel: ParentItemListStoreNameType,
): Promise<ParentItemListType<U> | null> {
  const parentId = clientList.parentId;
  const currentTimestamp = new Date();
  const clientLastModified = clientList.lastModified < currentTimestamp ? clientList.lastModified : currentTimestamp;

  let serverLastModified = await getListLastModifiedById(parentId);
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
            if (item.disposition === ItemDisposition.Deleted) {
              console.log(
                `mergeClientParentItemListWithServer: item.id=${item.id} disposition=${item.disposition}: delete item`,
              );
              await prismaItemModelInstance.delete({
                where: { id: item.id },
              });
              ++serverItemsDeleted;
            } else {
              const data = keepOnlyFieldsForUpdate<T>(item, lastModified);
              console.log(`mergeClientParentItemListWithServer: item.id=${item.id}: update item with data:`, data);
              return await prismaItemModelInstance.update({
                where: { id: item.id },
                data,
              });
            }
          } else {
            const data = keepOnlyFieldsForCreate<T>(item, parentId, lastModified);

            console.log(
              `mergeClientParentItemListWithServer: client sent an item without "id": create new item with data:`,
              data,
            );
            const createdItem = await prismaItemModelInstance.create({
              data,
            });
            console.log(`mergeClientParentItemListWithServer: createdItem:`, createdItem);
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
      const itemsAfterUpdate = (await prismaItemModelInstance.findMany({
        // where: buildWhereClause(parentModel, parentId),
        where: { parentId },
        orderBy: { lastModified: "asc" },
      })) as U[];

      console.log(
        `mergeClientParentItemListWithServer: client update with clientTimestamp=${dateToISOLocal(
          clientLastModified,
        )} applied:\n${clientItems.map((a) => a.id?.substring(0, 3)).join(", ")}\n.findMany returned ${
          itemsAfterUpdate.length
        } items:\n${itemsAfterUpdate.map((a) => a.id?.substring(0, 3)).join(", ")}\n`,
      );

      let clientItemsIncomplete = false;
      if (ghostItemsDetected == 0 && serverItemsCreated == 0 && serverItemsDeleted == 0) {
        // Compare server items with client items
        const clientItemIds = new Set(clientItems.map((a) => a.id));
        clientItemsIncomplete = !itemsAfterUpdate.every((serverItem) => clientItemIds.has(serverItem.id));
      }
      const clientNeedsUpdate = ghostItemsDetected || serverItemsCreated || serverItemsDeleted || clientItemsIncomplete;
      // Determine the lastModified timestamp based on the comparison
      const finalLastModified = clientNeedsUpdate ? currentTimestamp : clientLastModified;

      console.log(
        `mergeClientParentItemListWithServer: update role lastModified from server=${dateToISOLocal(
          serverLastModified,
        )} to finalLastModified=${dateToISOLocal(finalLastModified)}`,
      );

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

    return updatedList as ParentItemListType<U> | null;
  } else if (clientLastModified < serverLastModified) {
    return getList(parentId);
  }

  return null;
}

// export async function getParentItemList(
//   storeName: ParentItemListStoreNameType,
//   parentId: IdSchemaType,
// ): Promise<ParentItemListType<ItemServerToClientType>> {
//   return await prisma.$transaction(async (prisma) => {
//     const model: ParentItemListStoreNameType = storeName;
//     const parentModel: ParentItemListStoreNameType = getParentModel(model);
//     const prismaItemModelInstance = getModelAccessor(model, prisma as PrismaClient); // Type assertion
//     const prismaParentModelInstance = getModelAccessor(parentModel, prisma as PrismaClient); // Type assertion

//     // Retrieve the parent with its lastModified timestamp
//     const parent = await prismaParentModelInstance.findUnique({
//       where: { id: parentId },
//       select: { lastModified: true },
//     });

//     if (!parent) throw new Error(`User with ID ${parentId} not found.`);

//     // Retrieve the items for the parent
//     const items = await prismaItemModelInstance.findMany({
//       where: { parentId: parentId },
//       orderBy: { name: "asc" },
//     });

//     // Return the combined object
//     return {
//       parentId: parentId,
//       lastModified: parent.lastModified,
//       items: items,
//     } as ParentItemListType<ItemServerToClientType>;
//   });
// }
