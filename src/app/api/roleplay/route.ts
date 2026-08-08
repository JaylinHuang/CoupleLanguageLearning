import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { deepseekText } from "@/lib/deepseek-json";
import {
  getScenario,
  buildRoleplaySystemPrompt,
  buildRoleplayFeedbackPrompt,
} from "@/lib/roleplay";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scenarioId, messages, feedback } = await req.json();
  const scenario = getScenario(String(scenarioId ?? ""));
  if (!scenario || !Array.isArray(messages)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const history = (messages as Message[])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-20);

  // 结束对话：生成学习反馈
  if (feedback) {
    const transcript = history
      .map((m) => `${m.role === "user" ? "Learner" : scenario.titleZh}: ${m.content}`)
      .join("\n");
    const reply = await deepseekText(
      buildRoleplayFeedbackPrompt(scenario),
      transcript,
      600,
    );
    if (!reply) {
      return Response.json(
        { error: "AI is unavailable right now." },
        { status: 502 },
      );
    }
    return Response.json({ reply });
  }

  // 普通对话轮次
  const conversation = history
    .map((m) => `${m.role === "user" ? "Learner" : "你"}：${m.content}`)
    .join("\n");
  const reply = await deepseekText(
    buildRoleplaySystemPrompt(scenario),
    `对话记录：\n${conversation}\n\n请以角色身份回复学习者的最后一句话。`,
    400,
  );

  if (!reply) {
    return Response.json({ error: "AI is unavailable right now." }, { status: 502 });
  }

  return Response.json({ reply });
}
