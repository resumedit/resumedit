"use server";

import { dateToISOLocal } from "@/lib/utils/formatDate";
import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { OrganizationInputType, organizationSchema } from "@/schemas/organization";
import { OrganizationListServerInputType, OrganizationListServerOutputType } from "@/types/organization";
import { ModificationTimestampType } from "@/types/timestamp";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { getResumeLastModifiedById } from "./resume";
import { ItemDisposition } from "@/types/item";

export const getOrganizationId = () => {
  return v4();
};

export async function mergeClientOrganizationListWithServer(
  organizationList: OrganizationListServerInputType,
): Promise<OrganizationListServerOutputType | null> {
  const parentId = organizationList.parentId;
  const currentTimestamp = new Date();
  const clientLastModified =
    organizationList.lastModified < currentTimestamp ? organizationList.lastModified : currentTimestamp;

  let serverLastmodified = await getResumeLastModifiedById(parentId);
  serverLastmodified =
    serverLastmodified > currentTimestamp ? new Date(currentTimestamp.getMilliseconds() + 1) : serverLastmodified;

  if (clientLastModified > serverLastmodified) {
    // Detect if the client has any organizations not present on the server
    let ghostOrganizationDetected = 0;

    // Incorporate all changes from the client into the server's state
    const clientOrganizations = organizationList.items;

    // The organizations covered by the client are set to the clientLastModified timestamp
    const lastModified = clientLastModified;
    const updatedOrganizationList = await prisma.$transaction(async (prisma) => {
      // Process each organization for update or creation
      const organizationPromises = clientOrganizations.map(async (organization) => {
        const organizationInputType = organization;
        try {
          if (organization.id) {
            if (organization.disposition === ItemDisposition.Deleted) {
              await prisma.organization.delete({
                where: { id: organization.id },
              });
            } else {
              return await prisma.organization.update({
                where: { id: organization.id },
                data: { ...organizationInputType, lastModified },
              });
            }
          } else {
            const newOrganizationData = { ...organizationInputType, parentId, lastModified };
            console.log(
              `mergeClientOrganizationListWithServer: client sent an organization without "id": create new organization with data:`,
              newOrganizationData,
            );
            return await prisma.organization.create({
              data: newOrganizationData,
            });
          }
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            // Ignore not found error
            console.log(`Organization with id ${organization.id} not found. Ignoring update.`);
            ++ghostOrganizationDetected;
          } else {
            throw error; // Re-throw other errors
          }
        }
      });

      await Promise.all(organizationPromises);

      // Fetch updated organizations to ensure we include only existing ones
      // FIXME: Need to sort based on period spent at organizations, not based on name
      const organizationsAfterUpdate = await prisma.organization.findMany({
        where: { parentId },
        orderBy: { name: "asc" },
      });

      console.log(
        `mergeClientOrganizationListWithServer: client update with clientTimestamp=${dateToISOLocal(
          clientLastModified,
        )} applied:\n${clientOrganizations.map((a) => a.id?.substring(0, 3)).join(", ")}\n.findMany returned ${
          organizationsAfterUpdate.length
        } organizations:\n${organizationsAfterUpdate.map((a) => a.id?.substring(0, 3)).join(", ")}\n`,
      );

      let clientOrganizationsIncomplete = false;
      if (ghostOrganizationDetected == 0) {
        // Compare server organizations with client organizations
        const clientOrganizationIds = new Set(clientOrganizations.map((a) => a.id));
        clientOrganizationsIncomplete = !organizationsAfterUpdate.every((serverAch) =>
          clientOrganizationIds.has(serverAch.id),
        );
      }
      const clientNeedsUpdate = ghostOrganizationDetected || clientOrganizationsIncomplete;
      // Determine the lastModified timestamp based on the comparison
      const finalLastModified = clientNeedsUpdate ? currentTimestamp : clientLastModified;

      console.log(
        `mergeClientOrganizationListWithServer: update resume lastModified from server=${dateToISOLocal(
          serverLastmodified,
        )} to finalLastModified=${dateToISOLocal(finalLastModified)}`,
      );

      // Update the lastModified timestamp of the Resume
      await prisma.resume.update({
        where: { id: parentId },
        data: { lastModified: finalLastModified },
      });

      return {
        ...organizationList,
        lastModified: finalLastModified,
        items: organizationsAfterUpdate,
      };
    });

    return updatedOrganizationList;
  } else if (clientLastModified < serverLastmodified) {
    const serverOrganizationList = await getOrganizationList(parentId);
    console.log(
      `mergeClientOrganizationListWithServer: lastModified of client=${dateToISOLocal(
        clientLastModified,
      )} is older than server=${dateToISOLocal(serverLastmodified)}. Return ${
        serverOrganizationList.items.length
      } items`,
    );
    return serverOrganizationList;
  }
  // console.log(
  //   `mergeClientOrganizationListWithServer: lastModified of client matches server=${dateToISOLocal(
  //     serverLastmodified,
  //   )}`,
  // );
  return null;
}

export async function createOrganization(data: OrganizationInputType) {
  const validation = organizationSchema.safeParse(data);

  if (!validation.success) {
    throw new Error("Data to create organization failed validation");
  }

  console.log(`createOrganization(data):`, data);

  const organization = await prisma.organization.create({
    data,
  });

  if (!organization) {
    throw new Error("Creating organization failed on backend");
  }

  if (!organizationSchema.safeParse(organization)) {
    throw new Error("Created organization but backend data failed validation");
  }

  return organization;
}

export async function getOrganizationList(parentId: IdSchemaType): Promise<OrganizationListServerOutputType> {
  return await prisma.$transaction(async (prisma) => {
    // Retrieve the resume with its lastModified timestamp
    const resume = await prisma.resume.findUnique({
      where: { id: parentId },
      select: { lastModified: true },
    });

    if (!resume) throw new Error(`Resume with ID ${parentId} not found.`);

    // Retrieve the organizations for the resume
    const items = await prisma.organization.findMany({
      where: { parentId: parentId },
      orderBy: { name: "asc" },
    });

    // Return the combined object
    return {
      parentId: parentId,
      lastModified: resume.lastModified,
      items: items,
    } as unknown as OrganizationListServerOutputType;
  });
}

export async function getOrganizationById(id: IdSchemaType) {
  if (!id) {
    throw Error;
  }
  return await prisma.organization.findUnique({
    where: {
      id,
    },
  });
}

export async function getOrganizationLastModifiedById(id: IdSchemaType): Promise<ModificationTimestampType> {
  if (!id) {
    throw Error;
  }
  const organization = await getOrganizationById(id);
  return organization?.lastModified as ModificationTimestampType;
}

export async function updateOrganizationName(id: IdSchemaType, name: string) {
  return await prisma.organization.update({
    where: {
      id,
    },
    data: {
      name: name,
    },
  });
}

export async function updateOrganizationLocation(id: IdSchemaType, location: string) {
  return await prisma.organization.update({
    where: {
      id,
    },
    data: {
      location: location,
    },
  });
}
