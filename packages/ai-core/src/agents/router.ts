import { prisma } from "../db";
import type { AgentType, IntentResult } from "../types";

const VOCAB_PATTERNS = [
  /什么意思|是什么意思|what does .+ mean/i,
  /这个词|那个词|单词|词汇|vocabulary/i,
  /怎么读|拼音|pronunciation/i,
  /translate|翻译/i,
];

const GRAMMAR_PATTERNS = [
  /语法|grammar/i,
  /对不对|correct\??|is this right/i,
  /帮我改|纠错|correct my/i,
  /[\u4e00-\u9fff]{2,}/,
];

const PRACTICE_PATTERNS = [
  /练习|practice|对话|chat with me/i,
  /情景|scenario|roleplay/i,
  / let's (talk|chat|practice)/i,
];

const REPORT_PATTERNS = [
  /学习报告|my progress|how am i doing/i,
  /我的学习|learning report/i,
  /stats|statistics/i,
];

export function classifyIntent(query: string): IntentResult {
  const trimmed = query.trim();

  for (const p of REPORT_PATTERNS) {
    if (p.test(trimmed)) {
      return { agent: "report", confidence: 0.9, reason: "report keywords" };
    }
  }

  for (const p of PRACTICE_PATTERNS) {
    if (p.test(trimmed)) {
      return { agent: "practice", confidence: 0.85, reason: "practice keywords" };
    }
  }

  for (const p of VOCAB_PATTERNS) {
    if (p.test(trimmed)) {
      return { agent: "vocabulary", confidence: 0.85, reason: "vocabulary keywords" };
    }
  }

  const hasChinese = /[\u4e00-\u9fff]/.test(trimmed);
  for (const p of GRAMMAR_PATTERNS) {
    if (p.test(trimmed)) {
      if (hasChinese && trimmed.length > 4) {
        return { agent: "grammar", confidence: 0.8, reason: "Chinese sentence input" };
      }
      if (/语法|grammar|纠错|correct/i.test(trimmed)) {
        return { agent: "grammar", confidence: 0.85, reason: "grammar keywords" };
      }
    }
  }

  return { agent: "general", confidence: 0.5, reason: "default conversation" };
}

export async function getUserLearningContext(userId: string) {
  const progress = await prisma.userProgress.findUnique({ where: { userId } });
  const dueCards = await prisma.reviewCard.findMany({
    where: { userId, dueDate: { lte: new Date() }, wordId: { not: null } },
    include: { word: true },
    take: 10,
  });

  return {
    hskLevel: progress?.hskLevel ?? 1,
    xp: progress?.xp ?? 0,
    streak: progress?.streak ?? 0,
    dueWords: dueCards
      .map((c) => c.word?.simplified)
      .filter((s): s is string => Boolean(s)),
  };
}

export type AgentHandler = {
  type: AgentType;
  handle: (query: string, context: Awaited<ReturnType<typeof getUserLearningContext>>) => {
    sourceTypes?: Array<"word" | "grammar" | "example" | "lesson">;
    extraPrompt?: string;
  };
};

export const AGENT_HANDLERS: Record<AgentType, AgentHandler["handle"]> = {
  vocabulary: () => ({
    sourceTypes: ["word", "example"],
    extraPrompt: "Explain the word clearly with pinyin and an example sentence.",
  }),
  grammar: () => ({
    sourceTypes: ["grammar", "example", "lesson"],
    extraPrompt: "Analyze grammar structure step by step. Show corrected form if needed.",
  }),
  practice: () => ({
    sourceTypes: ["lesson", "example"],
    extraPrompt: "Lead a short scenario conversation. End with a question to keep her talking.",
  }),
  report: (_query, ctx) => ({
    extraPrompt: `Generate a warm progress summary. XP: ${ctx.xp}, streak: ${ctx.streak} days, HSK${ctx.hskLevel}. Due words: ${ctx.dueWords.join(", ") || "none"}.`,
  }),
  general: () => ({}),
};
