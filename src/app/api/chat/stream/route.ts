import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { isRemoteAiService, proxyStream } from "@/lib/ai-service-client";
import { runChatStream, FALLBACK_REPLY, type ChatMessage } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "LEARNER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { messages, sessionId } = body as {
    messages: ChatMessage[];
    sessionId?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  if (isRemoteAiService()) {
    return proxyStream(session, "/v1/chat/stream", { messages, sessionId });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return Response.json({ error: "DeepSeek API key not configured" }, { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseEncode(event, data)));
      };

      for await (const event of runChatStream({
        userId: session.id,
        messages,
        sessionId,
      })) {
        if (event.type === "meta") {
          send("meta", event.data);
        } else if (event.type === "token") {
          send("token", { content: event.content });
        } else if (event.type === "done") {
          send("done", {
            latencyMs: event.latencyMs,
            generationMs: "generationMs" in event ? event.generationMs : 0,
            tokensOut: "tokensOut" in event ? event.tokensOut : 0,
          });
        } else if (event.type === "error") {
          send("error", { message: event.message ?? FALLBACK_REPLY });
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
