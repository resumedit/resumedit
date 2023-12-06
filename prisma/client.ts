import { PrismaClient } from "@prisma/client";

// The first time this file is imported, the PrismaClient is created
// In subsequent imports, it will not create additional instances
// However, in development, the command next dev clears Node.js cache on run.
// This in turn initializes a new PrismaClient instance each time due to hot reloading that creates
// a connection to the database. This can quickly exhaust the database connections as each
// PrismaClient instance holds its own connection pool.

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
