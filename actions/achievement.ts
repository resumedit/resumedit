"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { AchievementInputType, AchievementOutputType, achievementSchema } from "@/schemas/achievement";
import { IdSchemaType } from "@/schemas/id";
import {
  AchievementDisposition,
  AchievementListServerInputType,
  AchievementListServerOutputType,
  transformToAchievementInputType,
} from "@/types/achievement";
import { Prisma } from "@prisma/client";
import { getRoleLastModifiedById } from "./role";

export async function mergeClientAchievementListWithServer(
  achievementList: AchievementListServerInputType,
): Promise<AchievementListServerOutputType | null> {
  const parentId = achievementList.parentId;
  const currentTimestamp = new Date();
  const clientLastModified =
    achievementList.lastModified < currentTimestamp ? achievementList.lastModified : currentTimestamp;

  let serverLastmodified = await getRoleLastModifiedById(parentId);
  serverLastmodified =
    serverLastmodified > currentTimestamp ? new Date(currentTimestamp.getMilliseconds() + 1) : serverLastmodified;

  if (clientLastModified > serverLastmodified) {
    // Detect if the client has any achievements not present on the server
    let ghostAchievementsDetected = 0;

    // Track achievements deleted on the server to indicate to the client
    // that it can remove those as well
    let serverAchievementsCreated = 0;

    // Track achievements deleted on the server to indicate to the client
    // that it can remove those as well
    let serverAchievementsDeleted = 0;

    // Incorporate all changes from the client into the server's state
    const clientAchievements = achievementList.items;

    // The achievements covered by the client are set to the clientLastModified timestamp
    const lastModified = clientLastModified;
    const updatedAchievementList = await prisma.$transaction(async (prisma) => {
      // Process each achievement for update or creation
      const achievementPromises = clientAchievements.map(async (achievement) => {
        const achievementInputType = transformToAchievementInputType(achievement);
        try {
          if (achievement.id) {
            if (achievement.disposition === AchievementDisposition.Deleted) {
              await prisma.achievement.delete({
                where: { id: achievement.id },
              });
              ++serverAchievementsDeleted;
            } else {
              return await prisma.achievement.update({
                where: { id: achievement.id },
                data: { ...achievementInputType, lastModified },
              });
            }
          } else {
            const newAchievementData = { ...achievementInputType, parentId, lastModified };
            console.log(
              `mergeClientAchievementListWithServer: client sent an achievement without "id": create new achievement with data:`,
              newAchievementData,
            );
            const createdAchievement = await prisma.achievement.create({
              data: newAchievementData,
            });
            ++serverAchievementsCreated;
            return createdAchievement;
          }
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            // Ignore not found error
            console.log(`Achievement with id ${achievement.id} not found. Ignoring update.`);
            ++ghostAchievementsDetected;
          } else {
            throw error; // Re-throw other errors
          }
        }
      });

      await Promise.all(achievementPromises);

      // Fetch updated achievements to ensure we include only existing ones
      const achievementsAfterUpdate = await prisma.achievement.findMany({
        where: { parentId },
        orderBy: { order: "asc" },
      });

      console.log(
        `mergeClientAchievementListWithServer: client update with clientTimestamp=${dateToISOLocal(
          clientLastModified,
        )} applied:\n${clientAchievements.map((a) => a.id?.substring(0, 3)).join(", ")}\n.findMany returned ${
          achievementsAfterUpdate.length
        } achievements:\n${achievementsAfterUpdate.map((a) => a.id?.substring(0, 3)).join(", ")}\n`,
      );

      let clientAchievementsIncomplete = false;
      if (ghostAchievementsDetected == 0 && serverAchievementsCreated == 0 && serverAchievementsDeleted == 0) {
        // Compare server achievements with client achievements
        const clientAchievementIds = new Set(clientAchievements.map((a) => a.id));
        clientAchievementsIncomplete = !achievementsAfterUpdate.every((serverAch) =>
          clientAchievementIds.has(serverAch.id),
        );
      }
      const clientNeedsUpdate =
        ghostAchievementsDetected ||
        serverAchievementsCreated ||
        serverAchievementsDeleted ||
        clientAchievementsIncomplete;
      // Determine the lastModified timestamp based on the comparison
      const finalLastModified = clientNeedsUpdate ? currentTimestamp : clientLastModified;

      console.log(
        `mergeClientAchievementListWithServer: update role lastModified from server=${dateToISOLocal(
          serverLastmodified,
        )} to finalLastModified=${dateToISOLocal(finalLastModified)}`,
      );

      // Update the lastModified timestamp of the Role
      await prisma.role.update({
        where: { id: parentId },
        data: { lastModified: finalLastModified },
      });

      return {
        ...achievementList,
        lastModified: finalLastModified,
        items: achievementsAfterUpdate,
      };
    });

    return updatedAchievementList;
  } else if (clientLastModified < serverLastmodified) {
    const serverAchievementList = await getAchievementList(parentId);
    console.log(
      `mergeClientAchievementListWithServer: lastModified of client=${dateToISOLocal(
        clientLastModified,
      )} is older than server=${dateToISOLocal(serverLastmodified)}. Return ${
        serverAchievementList.items.length
      } items`,
    );
    return serverAchievementList;
  }
  // console.log(
  //   `mergeClientAchievementListWithServer: lastModified of client matches server=${dateToISOLocal(
  //     serverLastmodified,
  //   )}`,
  // );
  return null;
}

// Utility function to find achievement by ID
const findAchievementById = (items: AchievementOutputType[], id: IdSchemaType) =>
  items.find((achievement) => achievement.id === id);

// This function merges an AchievementList from the client
// with the one in the database of the server.
// It uses per-achievement `lastModified` timestamps to
// reconcile any differences
export async function mergeClientAchievementsWithServer(
  parentId: IdSchemaType,
  clientAchievementList: AchievementListServerInputType,
): Promise<AchievementListServerOutputType> {
  // Fetch current AchievementList from the database
  const currentAchievementList = await prisma.achievement.findMany({
    where: { parentId },
  });

  const clientAchievements = clientAchievementList.items;
  const lastModified = clientAchievementList.lastModified;

  // Loop through client AchievementList and update the database
  for (const clientAchievement of clientAchievements) {
    if (clientAchievement.id !== undefined) {
      const existingAchievement = findAchievementById(currentAchievementList, clientAchievement.id);
      if (existingAchievement) {
        // Compare lastModified timestamps to decide which to keep
        if (
          clientAchievement.lastModified === undefined ||
          clientAchievement.lastModified > existingAchievement.lastModified!
        ) {
          // Update existing achievement with client data
          await prisma.achievement.update({
            where: { id: clientAchievement.id },
            data: { ...clientAchievement },
          });
        }
      } else {
        // If achievement does not exist in the database, create it
        await prisma.achievement.create({
          data: { ...clientAchievement, parentId },
        });
      }
    }
  }

  // Return the updated AchievementList
  const updatedAchievements = await prisma.achievement.findMany({
    where: { parentId },
  });
  const updatedAchievementList = {
    parentId: parentId,
    items: updatedAchievements,
    lastModified: lastModified,
  };
  return updatedAchievementList as AchievementListServerOutputType;
}

export async function createAchievement(data: AchievementInputType): Promise<AchievementOutputType> {
  const validation = achievementSchema.safeParse(data);

  if (!validation.success) {
    throw new Error("Data to create achievement failed validation");
  }

  const createdAchievement = await prisma.achievement.create({
    data,
  });

  if (!createdAchievement) {
    throw new Error("Creating achievement failed on backend");
  }

  if (!achievementSchema.safeParse(createdAchievement)) {
    throw new Error("Created achievement but backend data failed validation");
  }

  // Update the lastModified timestamp of the Role
  const parentId = createdAchievement.parentId;
  await prisma.role.update({
    where: { id: parentId },
    data: { lastModified: new Date() },
  });

  return createdAchievement;
}

export async function getAchievementList(parentId: IdSchemaType): Promise<AchievementListServerOutputType> {
  return await prisma.$transaction(async (prisma) => {
    // Retrieve the role with its lastModified timestamp
    const role = await prisma.role.findUnique({
      where: { id: parentId },
      select: { lastModified: true },
    });

    if (!role) throw new Error(`Role with ID ${parentId} not found.`);

    // Retrieve the achievements for the role
    const items = await prisma.achievement.findMany({
      where: { parentId: parentId },
      orderBy: { order: "asc" },
    });

    // Return the combined object
    return {
      parentId: parentId,
      lastModified: role.lastModified,
      items: items,
    } as AchievementListServerOutputType;
  });
}

export async function getAchievementById(id: IdSchemaType) {
  if (!id) {
    throw Error;
  }
  return await prisma.achievement.findUnique({
    where: {
      id,
    },
  });
}

export async function updateAchievement(id: IdSchemaType, data: AchievementInputType) {
  const updatedAchievement = await prisma.achievement.update({
    where: {
      id,
    },
    data: data,
  });

  // Update the lastModified timestamp of the Role
  const parentId = updatedAchievement.parentId;
  await prisma.role.update({
    where: { id: parentId },
    data: { lastModified: new Date() },
  });

  return updatedAchievement;
}

export async function updateAchievementContent(id: IdSchemaType, content: string) {
  const updatedAchievement = await prisma.achievement.update({
    where: {
      id,
    },
    data: {
      content: content,
    },
  });

  // Update the lastModified timestamp of the Role
  const parentId = updatedAchievement.parentId;
  await prisma.role.update({
    where: { id: parentId },
    data: { lastModified: new Date() },
  });

  return updatedAchievement;
}

export async function updateAchievementValue(id: IdSchemaType, value: number) {
  const updatedAchievement = await prisma.achievement.update({
    where: {
      id,
    },
    data: {
      value: value,
    },
  });

  // Update the lastModified timestamp of the Role
  const parentId = updatedAchievement.parentId;
  await prisma.role.update({
    where: { id: parentId },
    data: { lastModified: new Date() },
  });

  return updatedAchievement;
}

export async function updateAchievementOrder(id: IdSchemaType, order: AchievementInputType["order"]) {
  const updatedAchievement = await prisma.achievement.update({
    where: {
      id,
    },
    data: {
      order: order,
    },
  });

  // Update the lastModified timestamp of the Role
  const parentId = updatedAchievement.parentId;
  await prisma.role.update({
    where: { id: parentId },
    data: { lastModified: new Date() },
  });

  return updatedAchievement;
}

export async function deleteAchievementById(id: IdSchemaType) {
  if (!id) {
    throw Error;
  }
  const deletedAchievement = await prisma.achievement.delete({
    where: {
      id,
    },
  });

  // Update the lastModified timestamp of the Role
  const parentId = deletedAchievement.parentId;
  await prisma.role.update({
    where: { id: parentId },
    data: { lastModified: new Date() },
  });

  return deletedAchievement;
}
