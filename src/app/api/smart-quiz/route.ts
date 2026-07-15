import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deepseekJson } from "@/lib/deepseek-json";
import type { QuizAnswerDetail } from "@/lib/types";

export type SmartQuizQuestion = {
  type: "choice" | "fill_blank";
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
};

const SYSTEM_PROMPT = [
  "你是中文出题老师。根据学习者最近的错题和难词，出 5 道新的练习题帮她巩固薄弱点（变式练习，不要照抄原题）。",
  "学习者 Erika：HSK1-2 水平，母语英语。题目用英文提问（可包含中文词），explanation 用简短英文。",
  "以严格 JSON 返回：",
  '{"questions":[{"type":"choice","prompt":"...","options":["A","B","C","D"],"answer":"正确选项原文","explanation":"..."},{"type":"fill_blank","prompt":"...","answer":"单个词或短语","explanation":"..."}]}',
  "choice 题必须恰好 4 个选项且 answer 是其中之一；fill_blank 的答案要短且唯一。混合两种题型。",
].join("\n");

// 兜底：AI 不可用时用难词/错词生成简单选择题
async function buildFallbackQuestions(wordIds: string[]): Promise<SmartQuizQuestion[]> {
  const pool = await prisma.word.findMany({
    where: wordIds.length > 0 ? { id: { in: wordIds } } : { hskLevel: 1 },
    take: 5,
  });
  const distractorPool = await prisma.word.findMany({
    where: { hskLevel: { lte: 2 } },
    take: 50,
  });

  return pool.map((w) => {
    const distractors = distractorPool
      .filter((d) => d.id !== w.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((d) => d.english);
    const options = [w.english, ...distractors].sort(() => Math.random() - 0.5);
    return {
      type: "choice" as const,
      prompt: `What does "${w.simplified}" (${w.pinyin}) mean?`,
      options,
      answer: w.english,
      explanation: `${w.simplified} (${w.pinyin}) means "${w.english}".`,
    };
  });
}

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 收集素材：最近错题 + 标记为难的词
  const attempts = await prisma.lessonAttempt.findMany({
    where: { userId: session.id },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: { lesson: { select: { title: true } } },
  });

  const wrongAnswers: Array<{ prompt: string; correctAnswer: string; userAnswer: string }> = [];
  for (const a of attempts) {
    try {
      const answers = JSON.parse(a.answers) as QuizAnswerDetail[];
      for (const ans of answers) {
        if (!ans.isCorrect) {
          wrongAnswers.push({
            prompt: ans.prompt,
            correctAnswer: ans.correctAnswer,
            userAnswer: ans.userAnswer,
          });
        }
      }
    } catch {
      // 跳过旧数据
    }
  }

  const hardCards = await prisma.reviewCard.findMany({
    where: { userId: session.id, markedHard: true },
    include: { word: true },
    take: 10,
  });

  const material = [
    wrongAnswers.length > 0
      ? `最近错题：\n${wrongAnswers
          .slice(0, 10)
          .map((w) => `- 题目「${w.prompt}」正确答案「${w.correctAnswer}」她答成「${w.userAnswer || "未作答"}」`)
          .join("\n")}`
      : "",
    hardCards.length > 0
      ? `标记为难的词：${hardCards.map((c) => `${c.word.simplified}(${c.word.pinyin}, ${c.word.english})`).join("、")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (material) {
    const raw = await deepseekJson(SYSTEM_PROMPT, material, 1200);
    const questions = (raw as { questions?: SmartQuizQuestion[] } | null)?.questions;
    if (Array.isArray(questions) && questions.length > 0) {
      const valid = questions.filter(
        (q) =>
          q &&
          typeof q.prompt === "string" &&
          typeof q.answer === "string" &&
          (q.type === "fill_blank" ||
            (q.type === "choice" && Array.isArray(q.options) && q.options.includes(q.answer))),
      );
      if (valid.length > 0) {
        return Response.json({ questions: valid, source: "ai" });
      }
    }
  }

  // AI 失败或没有素材：本地生成
  const fallback = await buildFallbackQuestions(hardCards.map((c) => c.wordId));
  return Response.json({ questions: fallback, source: "fallback" });
}
