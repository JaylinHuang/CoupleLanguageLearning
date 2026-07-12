import { prisma } from "./db";

let pgvectorCache: boolean | null = null;

export async function isPgVectorEnabled(): Promise<boolean> {
  if (process.env.PGVECTOR_ENABLED === "false") return false;
  if (process.env.PGVECTOR_ENABLED === "true") return true;
  if (pgvectorCache !== null) return pgvectorCache;

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "pgvector_enabled" },
    });
    pgvectorCache = setting?.value === "true";
  } catch {
    pgvectorCache = false;
  }
  return pgvectorCache;
}

export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
