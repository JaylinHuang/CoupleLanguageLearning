import { prisma } from "./db";

export async function logAiCall(params: {
  userId?: string;
  endpoint: string;
  prompt: string;
  response?: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.aiCallLog.create({
      data: {
        userId: params.userId,
        endpoint: params.endpoint,
        prompt: params.prompt.slice(0, 8000),
        response: params.response?.slice(0, 8000),
        latencyMs: params.latencyMs,
        tokensIn: params.tokensIn,
        tokensOut: params.tokensOut,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (err) {
    console.error("[ai-log]", err);
  }
}

export async function getOrCreateSession(userId: string, agentType?: string) {
  const existing = await prisma.chatSession.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.chatSession.create({
    data: { userId, agentType },
  });
}

export async function saveChatMessage(
  sessionId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });
}
