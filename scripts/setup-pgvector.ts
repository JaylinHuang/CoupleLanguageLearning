import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { deserializeEmbedding } from "@erika/ai-core";

const prisma = new PrismaClient();
const DIMENSIONS = 1536;

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

async function main() {
  console.log("=== pgvector Setup ===\n");

  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "KnowledgeChunk"
    ADD COLUMN IF NOT EXISTS embedding_vec vector(${DIMENSIONS})
  `);

  const chunks = await prisma.knowledgeChunk.findMany({
    where: { embedding: { not: null } },
    select: { id: true, embedding: true },
  });

  console.log(`Migrating ${chunks.length} embeddings to pgvector...`);
  let migrated = 0;

  for (const chunk of chunks) {
    const vec = deserializeEmbedding(chunk.embedding);
    if (!vec || vec.length !== DIMENSIONS) continue;

    await prisma.$executeRawUnsafe(
      `UPDATE "KnowledgeChunk" SET embedding_vec = $1::vector WHERE id = $2`,
      toVectorLiteral(vec),
      chunk.id,
    );
    migrated++;
    if (migrated % 500 === 0) console.log(`  ${migrated}/${chunks.length}`);
  }

  console.log(`Migrated: ${migrated}`);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS knowledge_chunk_embedding_vec_idx
    ON "KnowledgeChunk"
    USING hnsw (embedding_vec vector_cosine_ops)
  `);

  await prisma.siteSetting.upsert({
    where: { key: "pgvector_enabled" },
    update: { value: "true" },
    create: { key: "pgvector_enabled", value: "true" },
  });

  console.log("\npgvector enabled with HNSW index.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
