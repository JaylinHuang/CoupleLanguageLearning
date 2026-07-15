import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deepseekJson } from "@/lib/deepseek-json";
import { awardXp, recordStudyDay } from "@/lib/progress";
import { XP_REWARDS } from "@/lib/constants";

export type GrammarCheckResult = {
  corrected: string;
  errors: Array<{ original: string; fixed: string; explanation: string }>;
  praise: string;
};

const SYSTEM_PROMPT = [
  "你是耐心的中文老师。学习者 Erika（HSK1-2 水平，母语英语/塔加洛语）写了中文句子，请批改。",
  "以严格 JSON 返回，结构如下：",
  '{"corrected":"改正后的完整句子","errors":[{"original":"错误片段","fixed":"正确写法","explanation":"简短英文解释（附拼音）"}],"praise":"一句英文鼓励，提及她做对的地方"}',
  "如果没有错误，errors 为空数组，corrected 与原句相同。explanation 必须是 Erika 能看懂的简单英文。",
].join("\n");

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed || trimmed.length > 500) {
    return Response.json({ error: "Please write 1-500 characters" }, { status: 400 });
  }

  const raw = await deepseekJson(SYSTEM_PROMPT, trimmed);
  if (!raw || typeof raw !== "object") {
    return Response.json(
      { error: "AI is unavailable right now. Try again later." },
      { status: 502 },
    );
  }

  const parsed = raw as Partial<GrammarCheckResult>;
  const result: GrammarCheckResult = {
    corrected: parsed.corrected ?? trimmed,
    errors: Array.isArray(parsed.errors)
      ? parsed.errors.filter(
          (e) => e && typeof e.original === "string" && typeof e.fixed === "string",
        )
      : [],
    praise: parsed.praise ?? "Good effort! Keep writing!",
  };

  // 归档批改记录供 Lin 查看
  await prisma.grammarCorrection.create({
    data: {
      userId: session.id,
      inputText: trimmed,
      result: JSON.stringify(result),
    },
  });

  await awardXp(session.id, XP_REWARDS.writingCheck);
  await recordStudyDay(session.id);

  return Response.json(result);
}
