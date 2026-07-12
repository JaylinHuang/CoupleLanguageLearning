import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/hsk");
const prisma = new PrismaClient();

type HskEntry = {
  simplified: string;
  forms: Array<{
    traditional?: string;
    transcriptions: { pinyin: string; numeric: string };
    meanings: string[];
  }>;
};

function parseGrammarCsv(raw: string) {
  const lines = raw.split("\n").slice(1);
  const points: Array<{
    no: number;
    level: number;
    group: string;
    category: string;
    details: string;
    content: string;
  }> = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 6) continue;
    points.push({
      no: Number(cols[0]),
      level: Number(cols[1]),
      group: cols[2],
      category: cols[3],
      details: cols[4],
      content: cols[5],
    });
  }
  return points;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

async function importVocabulary() {
  let total = 0;
  let created = 0;
  let updated = 0;

  for (let level = 1; level <= 6; level++) {
    const file = join(DATA_DIR, "wordlists", "exclusive", "old", `${level}.json`);
    if (!existsSync(file)) {
      console.error(`Missing ${file} — run: npm run hsk:download`);
      process.exit(1);
    }

    const entries: HskEntry[] = JSON.parse(readFileSync(file, "utf-8"));
    console.log(`HSK ${level}: ${entries.length} words`);

    for (const entry of entries) {
      const form = entry.forms[0];
      if (!form) continue;

      const simplified = entry.simplified;
      const pinyin = form.transcriptions.pinyin;
      const pinyinNumber = form.transcriptions.numeric;
      const english = form.meanings.join("; ");
      const traditional = form.traditional ?? null;
      const wordId = `hsk2-${simplified}`;

      const existing = await prisma.word.findUnique({ where: { id: wordId } });
      if (existing) {
        await prisma.word.update({
          where: { id: wordId },
          data: { pinyin, pinyinNumber, english, traditional, hskLevel: level },
        });
        updated++;
      } else {
        const bySimplified = await prisma.word.findFirst({ where: { simplified } });
        if (bySimplified && !bySimplified.id.startsWith("hsk2-")) {
          await prisma.word.update({
            where: { id: bySimplified.id },
            data: { pinyin, pinyinNumber, english, traditional, hskLevel: level },
          });
          updated++;
        } else if (bySimplified) {
          await prisma.word.update({
            where: { id: bySimplified.id },
            data: { pinyin, pinyinNumber, english, traditional, hskLevel: level },
          });
          updated++;
        } else {
          await prisma.word.create({
            data: {
              id: wordId,
              simplified,
              traditional,
              pinyin,
              pinyinNumber,
              english,
              hskLevel: level,
              isCustom: false,
            },
          });
          created++;
        }
      }
      total++;
    }
  }

  console.log(`Vocabulary: ${total} processed (${created} created, ${updated} updated)`);
}

async function importGrammar() {
  const file = join(DATA_DIR, "hsk30-grammar.csv");
  if (!existsSync(file)) {
    console.error(`Missing ${file} — run: npm run hsk:download`);
    process.exit(1);
  }

  const points = parseGrammarCsv(readFileSync(file, "utf-8"));
  console.log(`Grammar: ${points.length} points`);

  await prisma.siteSetting.upsert({
    where: { key: "hsk_grammar_count" },
    update: { value: String(points.length) },
    create: { key: "hsk_grammar_count", value: String(points.length) },
  });

  const { upsertKnowledgeBatch } = await import("@erika/ai-core");

  const docs = points.map((g) => {
    const level = Math.min(g.level, 6);
    return {
      sourceType: "grammar" as const,
      sourceId: `hsk30-grammar-${g.no}`,
      hskLevel: level,
      content: [
        `语法 #${g.no} (HSK${level})`,
        `类别: ${g.group} > ${g.category}`,
        g.details ? `要点: ${g.details}` : null,
        `内容: ${g.content}`,
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: {
        grammarPoint: g.details || g.category,
        english: g.content,
      },
    };
  });

  const BATCH = 50;
  for (let i = 0; i < docs.length; i += BATCH) {
    await upsertKnowledgeBatch(docs.slice(i, i + BATCH));
  }

  console.log(`Grammar indexed: ${points.length} points`);
}

async function main() {
  console.log("=== HSK Import Pipeline ===\n");
  await importVocabulary();
  console.log();
  await importGrammar();
  console.log("\n=== Import complete ===");
  console.log("Run `npm run ai:index` to rebuild remaining knowledge chunks.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
