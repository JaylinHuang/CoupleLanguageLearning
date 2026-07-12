import { Router } from "express";
import { runChatStream, runChat } from "@erika/ai-core";
import { requireLearner } from "../middleware/auth.js";

export const chatRouter = Router();

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

chatRouter.post("/chat/stream", requireLearner, async (req, res) => {
  const { messages, sessionId } = req.body as {
    messages: Array<{ role: string; content: string }>;
    sessionId?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Invalid messages" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const userId = req.serviceUser!.id;

  for await (const event of runChatStream({
    userId,
    messages: messages as Array<{ role: "user" | "assistant" | "system"; content: string }>,
    sessionId,
  })) {
    if (event.type === "meta") {
      res.write(sseEncode("meta", event.data));
    } else if (event.type === "token") {
      res.write(sseEncode("token", { content: event.content }));
    } else if (event.type === "done") {
      res.write(
        sseEncode("done", {
          latencyMs: event.latencyMs,
          generationMs: event.generationMs,
          tokensOut: event.tokensOut,
        }),
      );
    } else if (event.type === "error") {
      res.write(sseEncode("error", { message: event.message }));
    }
  }

  res.end();
});

chatRouter.post("/chat", requireLearner, async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid messages" });
    return;
  }

  const result = await runChat({
    userId: req.serviceUser!.id,
    messages,
  });

  if ("error" in result && "status" in result) {
    res.status(result.status ?? 500).json({ error: result.error });
    return;
  }

  res.json(result);
});
