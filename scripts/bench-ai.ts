import "dotenv/config";
import { performance } from "perf_hooks";
import { PrismaClient } from "@prisma/client";
import { createSessionToken, COOKIE_NAME } from "../src/lib/auth";
import { getKnowledgeStats } from "@erika/ai-core";

const BASE = process.env.BENCH_BASE_URL ?? "http://localhost:3000";
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY ?? 10);
const SAMPLES = Number(process.env.BENCH_SAMPLES ?? 20);

type BenchResult = {
  name: string;
  samples: number[];
  p50: number;
  p99: number;
  min: number;
  max: number;
  errors: number;
};

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function summarize(name: string, times: number[], errors: number): BenchResult {
  const sorted = [...times].sort((a, b) => a - b);
  return {
    name,
    samples: sorted,
    p50: sorted.length ? percentile(sorted, 50) : 0,
    p99: sorted.length ? percentile(sorted, 99) : 0,
    min: sorted.length ? sorted[0] : 0,
    max: sorted.length ? sorted[sorted.length - 1] : 0,
    errors,
  };
}

async function getSessionCookie(): Promise<string> {
  if (process.env.BENCH_COOKIE) return process.env.BENCH_COOKIE;

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { username: "erika" } });
    if (!user) throw new Error("erika user not found in database");
    const token = await createSessionToken({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: "LEARNER",
    });
    return `${COOKIE_NAME}=${token}`;
  } finally {
    await prisma.$disconnect();
  }
}

async function benchRag(cookie: string): Promise<BenchResult> {
  const times: number[] = [];
  let errors = 0;

  for (let i = 0; i < SAMPLES; i++) {
    const start = performance.now();
    try {
      const res = await fetch(`${BASE}/api/rag/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ query: "想是什么意思", hskLevel: 1 }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (typeof data.retrievalMs !== "number") throw new Error("no retrievalMs");
      times.push(data.retrievalMs);
    } catch {
      errors++;
      times.push(performance.now() - start);
    }
  }

  return summarize("RAG Search (/api/rag/search)", times, errors);
}

async function benchFirstToken(cookie: string): Promise<BenchResult> {
  const times: number[] = [];
  let errors = 0;

  for (let i = 0; i < Math.min(SAMPLES, 10); i++) {
    const start = performance.now();
    try {
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ messages: [{ role: "user", content: "你好" }] }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("no body");

      const decoder = new TextDecoder();
      let buffer = "";
      let firstTokenMs: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (firstTokenMs === null && buffer.includes("event: token")) {
          firstTokenMs = performance.now() - start;
          reader.cancel();
          break;
        }
      }

      if (firstTokenMs === null) throw new Error("no token");
      times.push(firstTokenMs);
    } catch {
      errors++;
    }
  }

  return summarize("SSE First Token (/api/chat/stream)", times, errors);
}

async function benchSseConcurrent(cookie: string): Promise<BenchResult> {
  const start = performance.now();
  let errors = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      try {
        const res = await fetch(`${BASE}/api/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ messages: [{ role: "user", content: "你好" }] }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("no body");
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } catch {
        errors++;
      }
    }),
  );

  const total = performance.now() - start;
  return summarize(`SSE Concurrent (${CONCURRENCY} connections)`, [total], errors);
}

function printResult(r: BenchResult) {
  console.log(`\n## ${r.name}`);
  console.log(`  samples: ${r.samples.length}, errors: ${r.errors}`);
  console.log(`  p50: ${r.p50.toFixed(1)}ms, p99: ${r.p99.toFixed(1)}ms`);
  if (r.samples.length > 1) {
    console.log(`  min: ${r.min.toFixed(1)}ms, max: ${r.max.toFixed(1)}ms`);
  }
}

export type BenchReport = {
  target: string;
  date: string;
  knowledge: Awaited<ReturnType<typeof getKnowledgeStats>>;
  rag: BenchResult;
  firstToken: BenchResult;
  sseConcurrent: BenchResult;
};

export async function runBenchSuite(baseUrl: string): Promise<BenchReport> {
  process.env.BENCH_BASE_URL = baseUrl;
  const cookie = await getSessionCookie();
  const knowledge = await getKnowledgeStats();

  const rag = await benchRag(cookie);
  const firstToken = await benchFirstToken(cookie);
  const sseConcurrent = await benchSseConcurrent(cookie);

  return {
    target: baseUrl,
    date: new Date().toISOString().slice(0, 10),
    knowledge,
    rag,
    firstToken,
    sseConcurrent,
  };
}

async function main() {
  console.log("=== AI Service Benchmark ===");
  console.log(`Target: ${BASE}\n`);

  const cookie = await getSessionCookie();
  const knowledge = await getKnowledgeStats();
  console.log(`Knowledge chunks: ${knowledge.total}, pgvector: ${knowledge.pgvector}`);

  const ragResult = await benchRag(cookie);
  printResult(ragResult);

  const firstTokenResult = await benchFirstToken(cookie);
  printResult(firstTokenResult);

  const concurrentResult = await benchSseConcurrent(cookie);
  printResult(concurrentResult);

  console.log("\n=== Acceptance Criteria ===");
  console.log(
    `  RAG retrieval p50 < 200ms: ${ragResult.p50 < 200 ? "PASS" : "FAIL"} (${ragResult.p50.toFixed(0)}ms)`,
  );
  console.log(
    `  SSE first token p50 < 500ms: ${firstTokenResult.p50 < 500 ? "PASS" : "FAIL"} (${firstTokenResult.p50.toFixed(0)}ms)`,
  );
  console.log(
    `  SSE ${CONCURRENCY}-way concurrent errors: ${concurrentResult.errors === 0 ? "PASS" : "FAIL"} (${concurrentResult.errors} errors)`,
  );
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("bench-ai.ts");
if (isMain) {
  main().catch(console.error);
}
