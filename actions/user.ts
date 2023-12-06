"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { InvalidAuthUserErr, UserUpsertFailedErr, getPrimaryEmailAddress } from "@/auth/clerk/userActions";
import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { ModificationTimestampType } from "@/types/timestamp";
import { currentUser } from "@clerk/nextjs";
import { User as ClerkAuthUser } from "@clerk/nextjs/server";
import type { User as PrismaUser, User } from "@prisma/client";

export const getCurrentUserOrNull = async (): Promise<PrismaUser | null> => {
  try {
    return await getCurrentUser();
  } catch (error) {
    console.log(`actions/user.ts:getCurrentUserOrNull(): exception in getCurrentUser(): `, error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<PrismaUser> => {
  let authUser = null;
  if (process.env.NODE_ENV === "development" && process.env.DEVELOPMENT_USER_AUTH_PROVIDER_ID) {
    const developomentAuthProviderId = process.env.DEVELOPMENT_USER_AUTH_PROVIDER_ID;
    const developmentAuthUser = await getUserByAuthProviderId(developomentAuthProviderId);

    if (developmentAuthUser) {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        id: _id, // Rename 'id' to '_id' to indicate it's unused
        authProviderId,
        firstName = "DEVELOPMENT",
        lastName = "USER",
        ...otherProps
      } = developmentAuthUser;

      authUser = {
        id: developomentAuthProviderId,
        primaryEmailAddressId: "primary",
        emailAddresses: [{ id: "primary", emailAddress: "test@resumedit.app" }],
        firstName,
        lastName,
        ...otherProps,
      } as unknown as ClerkAuthUser;
      console.log(`actions/user: DEVELOPMENT_USER_AUTH_PROVIDER_ID=(${authProviderId}) authUser=`, authUser);
    } else {
      console.log(
        `actions/user: user with authProviderId=DEVELOPMENT_USER_AUTH_PROVIDER_ID=(${developomentAuthProviderId}) is ${developmentAuthUser}`,
      );
      throw new InvalidAuthUserErr(`Invalid DEVELOPMENT_USER_AUTH_PROVIDER_ID="${developomentAuthProviderId}"`);
    }
  } else {
    authUser = await currentUser();
    if (!authUser) {
      console.log(`actions/user: currentUser() returned authUser=`, authUser);
      throw new InvalidAuthUserErr(`Invalid authUser=${authUser}`);
    }
  }

  if (!authUser?.primaryEmailAddressId) {
    throw new InvalidAuthUserErr(`Invalid authUser.primaryEmailAddressId=${authUser.primaryEmailAddressId}`);
  }

  const primaryEmail = getPrimaryEmailAddress(authUser);
  if (!primaryEmail) {
    throw new InvalidAuthUserErr(`Invalid authUser.primaryEmailAddressId=${authUser.primaryEmailAddressId}`);
  }

  // Create or update user
  const userData = {
    authProviderId: authUser.id,
    email: primaryEmail,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
  };

  console.log(`actions/user:getCurrentUser: userData:`, userData);

  const user = await prisma.user.upsert({
    where: { authProviderId: authUser.id },
    update: userData,
    create: userData,
  });
  if (!user) {
    throw new UserUpsertFailedErr();
  }

  // https://stackoverflow.com/a/77258216/617559
  // const makeInstantiator =
  //   <T extends z.ZodType<any>>(model: T) =>
  //   (input: z.input<T>): z.output<T> => {
  //     return model.safeParse(input);
  //   };

  // const instantiateUser = makeInstantiator(userSchema);
  // const augmentedUser = instantiateUser(user);
  // console.log(`actions/user: augmentedUser returned`, augmentedUser);
  // return augmentedUser;
  return user;
};

export const getUserByAuthProviderId = async (authProviderId: string): Promise<User | undefined> => {
  const user = await prisma.user.findUnique({
    where: { authProviderId: authProviderId },
  });
  if (!user) {
    throw Error(`No user with authProviderId=${authProviderId.substring(0, authProviderId.length / 4)} found`);
  }

  return user;
};

export async function getUserById(id: IdSchemaType) {
  if (!id) {
    throw Error;
  }
  return await prisma.user.findUnique({
    where: {
      id,
    },
  });
}

export async function getUserLastModifiedById(id: IdSchemaType): Promise<ModificationTimestampType> {
  if (!id) {
    throw Error;
  }
  const user = await getUserById(id);
  return user?.lastModified as ModificationTimestampType;
}
