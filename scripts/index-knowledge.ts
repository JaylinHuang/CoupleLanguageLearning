import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import {
  upsertKnowledge,
  upsertKnowledgeBatch,
  getKnowledgeStats,
  buildWordDocument,
  needsReindex,
  type IndexFilter,
  type SourceType,
} from "@erika/ai-core";
import { parseLessonContent } from "../src/lib/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/hsk");
const prisma = new PrismaClient();

function parseArgs(): IndexFilter & { help?: boolean } {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }
  return {
    incremental: args.includes("--incremental") || args.includes("-i"),
    skipWords: args.includes("--skip-words"),
    typeOnly: args.find((a) => a.startsWith("--type="))?.split("=")[1] as SourceType | undefined,
  };
}

function printHelp() {
  console.log(`Usage: npm run ai:index [-- options]

Options:
  --incremental, -i   Only index new or changed content (recommended for daily use)
  --skip-words        Skip vocabulary; index lessons/examples/grammar only
  --type=word         Index only one source type (word|grammar|example|lesson)
  --help, -h          Show this help

Examples:
  npm run ai:index                  Full reindex (~5000 words, ~12 min)
  npm run ai:index -- --incremental After adding/editing a few words (~seconds)
  npm run ai:index -- --skip-words  Refresh lessons only
`);
}

async function loadChunkMap(sourceType: SourceType) {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { sourceType },
    select: { sourceId: true, updatedAt: true, content: true },
  });
  return new Map(chunks.map((c) => [c.sourceId, c]));
}

async function indexWords(filter: IndexFilter) {
  if (filter.skipWords || (filter.typeOnly && filter.typeOnly !== "word")) return;

  const words = await prisma.word.findMany();
  const chunkMap = filter.incremental
    ? await loadChunkMap("word")
    : new Map<string, { updatedAt: Date; content: string }>();

  const toIndex = filter.incremental
    ? words.filter((w) => {
        const doc = buildWordDocument(w);
        const chunk = chunkMap.get(w.id);
        return needsReindex(w.updatedAt, chunk, doc.content);
      })
    : words;

  console.log(
    `Indexing ${toIndex.length} words${filter.incremental ? ` (${words.length - toIndex.length} unchanged skipped)` : ""}...`,
  );

  const BATCH = 50;
  for (let i = 0; i < toIndex.length; i += BATCH) {
    const batch = toIndex.slice(i, i + BATCH).map(buildWordDocument);
    await upsertKnowledgeBatch(batch);
    if (toIndex.length > BATCH) {
      console.log(`  ${Math.min(i + BATCH, toIndex.length)}/${toIndex.length}`);
    }
  }
}

async function indexLessons(filter: IndexFilter) {
  if (filter.typeOnly && filter.typeOnly !== "lesson" && filter.typeOnly !== "example") return;

  const lessons = await prisma.lesson.findMany({ where: { published: true } });
  const lessonChunkMap = filter.incremental ? await loadChunkMap("lesson") : new Map();
  const exampleChunkMap = filter.incremental ? await loadChunkMap("example") : new Map();

  let lessonCount = 0;
  let exampleCount = 0;

  for (const lesson of lessons) {
    let content: ReturnType<typeof parseLessonContent>;
    try {
      content = parseLessonContent(lesson.content);
    } catch {
      continue;
    }

    const lessonContent = `课程: ${lesson.title}\n${lesson.description ?? ""}\n${content.intro}`;

    if (!filter.typeOnly || filter.typeOnly === "lesson") {
      const shouldIndexLesson =
        !filter.incremental ||
        needsReindex(lesson.updatedAt, lessonChunkMap.get(lesson.id), lessonContent);

      if (shouldIndexLesson) {
        await upsertKnowledge({
          sourceType: "lesson",
          sourceId: lesson.id,
          hskLevel: lesson.hskLevel,
          content: lessonContent,
          metadata: { lessonTitle: lesson.title },
        });
        lessonCount++;
      }
    }

    if (!filter.typeOnly || filter.typeOnly === "example") {
      for (const [i, sentence] of content.sentences.entries()) {
        const sourceId = `${lesson.id}-s${i}`;
        const exampleContent = `例句: ${sentence.chinese}\n拼音: ${sentence.pinyin}\n英文: ${sentence.english}`;
        const shouldIndexExample =
          !filter.incremental ||
          needsReindex(lesson.updatedAt, exampleChunkMap.get(sourceId), exampleContent);

        if (shouldIndexExample) {
          await upsertKnowledge({
            sourceType: "example",
            sourceId,
            hskLevel: lesson.hskLevel,
            content: exampleContent,
            metadata: {
              exampleSentence: sentence.chinese,
              pinyin: sentence.pinyin,
              english: sentence.english,
              lessonTitle: lesson.title,
            },
          });
          exampleCount++;
        }
      }
    }
  }

  console.log(`Lessons: ${lessonCount} indexed, Examples: ${exampleCount} indexed`);
}

async function indexGrammar(filter: IndexFilter) {
  if (filter.typeOnly && filter.typeOnly !== "grammar") return;

  const hsk30File = join(DATA_DIR, "hsk30-grammar.csv");
  if (existsSync(hsk30File)) {
    console.log("Grammar: using HSK 3.0 CSV (import via hsk:import for full grammar index)");
    return;
  }

  type GrammarPoint = {
    hskLevel: number;
    point: string;
    explanation: string;
    examples: string[];
  };

  const localFile = join(DATA_DIR, "grammar-hsk1.json");
  if (!existsSync(localFile)) return;

  const grammarData: GrammarPoint[] = JSON.parse(readFileSync(localFile, "utf-8"));
  console.log(`Indexing ${grammarData.length} local grammar points...`);
  for (const [i, g] of grammarData.entries()) {
    await upsertKnowledge({
      sourceType: "grammar",
      sourceId: `grammar-hsk1-${i}`,
      hskLevel: g.hskLevel,
      content: `语法: ${g.point}\n说明: ${g.explanation}\n例句: ${g.examples.join(" | ")}`,
      metadata: { grammarPoint: g.point, english: g.explanation },
    });
  }
}

async function main() {
  const filter = parseArgs();
  if (filter.help) {
    printHelp();
    return;
  }

  console.log("=== Knowledge Index Pipeline ===");
  if (filter.incremental) console.log("Mode: incremental (changed content only)");
  if (filter.skipWords) console.log("Mode: skip words");
  if (filter.typeOnly) console.log(`Mode: type=${filter.typeOnly}`);
  console.log();

  await indexWords(filter);
  await indexLessons(filter);
  await indexGrammar(filter);

  const stats = await getKnowledgeStats();
  console.log("\n=== Index complete ===");
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
