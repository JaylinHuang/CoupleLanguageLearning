import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { isRemoteAiService, proxyJson, proxyGet } from "@/lib/ai-service-client";
import { upsertKnowledge, getKnowledgeStats, reindexWord } from "@/lib/ai";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRemoteAiService()) {
    return proxyGet(session, "/v1/knowledge/stats");
  }

  const stats = await getKnowledgeStats();
  return Response.json(stats);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (isRemoteAiService()) {
    return proxyJson(session, "/v1/knowledge/index", body);
  }

  const { action, document, sourceId } = body;

  if (action === "upsert" && document) {
    const id = await upsertKnowledge(document);
    return Response.json({ ok: true, id });
  }

  if (action === "reindex-word" && sourceId) {
    const id = await reindexWord(sourceId);
    if (!id) {
      return Response.json({ error: "Word not found" }, { status: 404 });
    }
    return Response.json({ ok: true, id });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
