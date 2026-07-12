import "dotenv/config";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../data/hsk");

const SOURCES = [
  ...Array.from({ length: 6 }, (_, i) => ({
    url: `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/${i + 1}.json`,
    dest: join(DATA_DIR, "wordlists", "exclusive", "old", `${i + 1}.json`),
  })),
  {
    url: "https://raw.githubusercontent.com/ivankra/hsk30/master/hsk30-grammar.csv",
    dest: join(DATA_DIR, "hsk30-grammar.csv"),
  },
];

async function download(url: string, dest: string) {
  if (existsSync(dest)) {
    console.log(`  skip (exists): ${dest}`);
    return;
  }

  console.log(`  downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, await res.text(), "utf-8");
  console.log(`  saved: ${dest}`);
}

async function main() {
  console.log("=== Download HSK Data ===\n");
  for (const { url, dest } of SOURCES) {
    await download(url, dest);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
