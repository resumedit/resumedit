"use server";

import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { RoleInputType, RoleOutputType, roleSchema } from "@/schemas/role";
import { ModificationTimestampType } from "@/types/timestamp";
import { v4 } from "uuid";

export const getRoleId = () => {
  return v4();
};

export async function createRole(data: RoleInputType): Promise<RoleOutputType> {
  const validation = roleSchema.safeParse(data);

  if (!validation.success) {
    throw new Error("Data to create role failed validation");
  }

  // console.log(`createRole(data):`, data);

  const role = await prisma.role.create({
    data,
  });

  if (!role) {
    throw new Error("Creating role failed on backend");
  }

  if (!roleSchema.safeParse(role)) {
    throw new Error("Created role but backend data failed validation");
  }

  return role;
}

export async function getRoles(parentId: IdSchemaType) {
  return await prisma.role.findMany({
    where: {
      parentId,
    },
    orderBy: {
      name: "desc",
    },
  });
}

export async function getRoleById(id: IdSchemaType) {
  if (!id) {
    throw Error;
  }
  return await prisma.role.findUnique({
    where: {
      id,
    },
  });
}

export async function getRoleLastModifiedById(id: IdSchemaType): Promise<ModificationTimestampType> {
  if (!id) {
    throw Error;
  }
  const role = await getRoleById(id);
  return role?.lastModified as ModificationTimestampType;
}

export async function updateRoleName(id: IdSchemaType, name: string) {
  return await prisma.role.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
}

export async function updateRoleLocation(id: IdSchemaType, location: string) {
  return await prisma.role.update({
    where: {
      id,
    },
    data: {
      location,
    },
  });
}
