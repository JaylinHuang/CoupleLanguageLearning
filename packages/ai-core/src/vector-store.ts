import { prisma } from "./db";
import {
  cosineSimilarity,
  deserializeEmbedding,
  embedText,
  embedBatch,
  serializeEmbedding,
} from "./embeddings";
import { isPgVectorEnabled, toVectorLiteral } from "./pgvector";
import type {
  KnowledgeDocument,
  KnowledgeMetadata,
  RetrievalResult,
  SourceType,
} from "./types";

function parseMetadata(raw: string): KnowledgeMetadata {
  try {
    return JSON.parse(raw) as KnowledgeMetadata;
  } catch {
    return {};
  }
}

async function syncPgVector(id: string, embedding: number[]): Promise<void> {
  if (!(await isPgVectorEnabled())) return;
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "KnowledgeChunk" SET embedding_vec = $1::vector WHERE id = $2`,
      toVectorLiteral(embedding),
      id,
    );
  } catch (err) {
    console.error("[pgvector sync]", err);
  }
}

async function persistKnowledge(
  doc: KnowledgeDocument,
  embedding: number[],
): Promise<string> {
  const metadataStr = JSON.stringify(doc.metadata);
  const embeddingStr = serializeEmbedding(embedding);
  let id: string;

  if (doc.id) {
    await prisma.knowledgeChunk.update({
      where: { id: doc.id },
      data: {
        sourceType: doc.sourceType,
        sourceId: doc.sourceId,
        hskLevel: doc.hskLevel,
        content: doc.content,
        metadata: metadataStr,
        embedding: embeddingStr,
      },
    });
    id = doc.id;
  } else {
    const existing = doc.sourceId
      ? await prisma.knowledgeChunk.findFirst({
          where: { sourceType: doc.sourceType, sourceId: doc.sourceId },
        })
      : null;

    if (existing) {
      await prisma.knowledgeChunk.update({
        where: { id: existing.id },
        data: {
          hskLevel: doc.hskLevel,
          content: doc.content,
          metadata: metadataStr,
          embedding: embeddingStr,
        },
      });
      id = existing.id;
    } else {
      const created = await prisma.knowledgeChunk.create({
        data: {
          sourceType: doc.sourceType,
          sourceId: doc.sourceId,
          hskLevel: doc.hskLevel,
          content: doc.content,
          metadata: metadataStr,
          embedding: embeddingStr,
        },
      });
      id = created.id;
    }
  }

  await syncPgVector(id, embedding);
  return id;
}

export async function upsertKnowledge(doc: KnowledgeDocument): Promise<string> {
  const embedding = await embedText(doc.content);
  return persistKnowledge(doc, embedding);
}

export async function upsertKnowledgeBatch(docs: KnowledgeDocument[]): Promise<number> {
  if (docs.length === 0) return 0;
  const embeddings = await embedBatch(docs.map((d) => d.content));
  for (let i = 0; i < docs.length; i++) {
    await persistKnowledge(docs[i], embeddings[i]);
  }
  return docs.length;
}

export async function deleteKnowledgeBySource(
  sourceType: SourceType,
  sourceId: string,
): Promise<void> {
  await prisma.knowledgeChunk.deleteMany({ where: { sourceType, sourceId } });
}

async function searchWithPgVector(
  queryEmbedding: number[],
  options: { topK: number; hskLevel?: number; sourceTypes?: SourceType[] },
): Promise<RetrievalResult[]> {
  const vec = toVectorLiteral(queryEmbedding);
  const conditions: string[] = ["embedding_vec IS NOT NULL"];
  const params: unknown[] = [vec, vec, options.topK];
  let paramIdx = 4;

  if (options.hskLevel) {
    conditions.push(`"hskLevel" = $${paramIdx}`);
    params.push(options.hskLevel);
    paramIdx++;
  }
  if (options.sourceTypes?.length) {
    conditions.push(`"sourceType" = ANY($${paramIdx})`);
    params.push(options.sourceTypes);
    paramIdx++;
  }

  const whereClause = conditions.join(" AND ");
  const sql = `
    SELECT id, "sourceType", "sourceId", "hskLevel", content, metadata,
           1 - (embedding_vec <=> $1::vector) AS score
    FROM "KnowledgeChunk"
    WHERE ${whereClause}
    ORDER BY embedding_vec <=> $2::vector
    LIMIT $3
  `;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      sourceType: string;
      sourceId: string | null;
      hskLevel: number | null;
      content: string;
      metadata: string;
      score: number;
    }>
  >(sql, ...params);

  return rows.map((row) => ({
    id: row.id,
    sourceType: row.sourceType as SourceType,
    sourceId: row.sourceId,
    hskLevel: row.hskLevel,
    content: row.content,
    metadata: parseMetadata(row.metadata),
    score: Number(row.score),
  }));
}

async function searchInMemory(
  queryEmbedding: number[],
  options: { topK: number; hskLevel?: number; sourceTypes?: SourceType[] },
): Promise<RetrievalResult[]> {
  const where: { hskLevel?: number; sourceType?: { in: SourceType[] } } = {};
  if (options.hskLevel) where.hskLevel = options.hskLevel;
  if (options.sourceTypes?.length) where.sourceType = { in: options.sourceTypes };

  const chunks = await prisma.knowledgeChunk.findMany({
    where,
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      hskLevel: true,
      content: true,
      metadata: true,
      embedding: true,
    },
  });

  const scored: RetrievalResult[] = [];
  for (const chunk of chunks) {
    const vec = deserializeEmbedding(chunk.embedding);
    if (!vec) continue;
    scored.push({
      id: chunk.id,
      sourceType: chunk.sourceType as SourceType,
      sourceId: chunk.sourceId,
      hskLevel: chunk.hskLevel,
      content: chunk.content,
      metadata: parseMetadata(chunk.metadata),
      score: cosineSimilarity(queryEmbedding, vec),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, options.topK);
}

export async function searchKnowledge(
  queryEmbedding: number[],
  options: { topK: number; hskLevel?: number; sourceTypes?: SourceType[] },
): Promise<RetrievalResult[]> {
  if (await isPgVectorEnabled()) {
    try {
      return await searchWithPgVector(queryEmbedding, options);
    } catch (err) {
      console.error("[pgvector search fallback]", err);
    }
  }
  return searchInMemory(queryEmbedding, options);
}

export async function getKnowledgeStats() {
  const total = await prisma.knowledgeChunk.count();
  const byType = await prisma.knowledgeChunk.groupBy({
    by: ["sourceType"],
    _count: true,
  });
  const pgvector = await isPgVectorEnabled();
  return { total, byType, pgvector };
}
