import { User as ClerkAuthUser } from "@clerk/nextjs/server";

export class NotAuthenticatedErr extends Error {}
export class InvalidAuthUserErr extends Error {}
export class UserUpsertFailedErr extends Error {}

export const getFullName = (authUser: ClerkAuthUser) => {
  return `${authUser.firstName} ${authUser.firstName}`;
};

export const getPrimaryEmailAddress = (authUser: ClerkAuthUser) => {
  const emailAddresses = authUser.emailAddresses;
  const primaryEmailAddressId = authUser.primaryEmailAddressId;

  if (emailAddresses && primaryEmailAddressId) {
    const primaryEmailAddress = emailAddresses.find((a) => a.id === primaryEmailAddressId);
    if (primaryEmailAddress) {
      return primaryEmailAddress?.emailAddress;
    }
  }
  return undefined;
};
