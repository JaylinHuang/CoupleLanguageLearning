import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { aiCorePrisma: PrismaClient };

export const prisma =
  globalForPrisma.aiCorePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.aiCorePrisma = prisma;
