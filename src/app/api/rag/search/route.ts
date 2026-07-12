import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { isRemoteAiService, proxyJson } from "@/lib/ai-service-client";
import { retrieve } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (isRemoteAiService()) {
    return proxyJson(session, "/v1/rag/search", body);
  }

  const { query, hskLevel, topK, rerankTopK } = body;
  if (!query || typeof query !== "string") {
    return Response.json({ error: "query required" }, { status: 400 });
  }

  const { results, retrievalMs } = await retrieve(query, {
    topK: topK ?? 8,
    rerankTopK: rerankTopK ?? 4,
    hskLevel,
  });

  return Response.json({ results, retrievalMs });
}
