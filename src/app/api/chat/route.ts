import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { isRemoteAiService, proxyJson } from "@/lib/ai-service-client";
import { runChat, type ChatMessage } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();
  if (!Array.isArray(messages)) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  if (isRemoteAiService()) {
    return proxyJson(session, "/v1/chat", { messages });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "DeepSeek API key not configured" }, { status: 500 });
  }

  const result = await runChat({
    userId: session.id,
    messages: messages as ChatMessage[],
  });

  if ("error" in result && "status" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result);
}
