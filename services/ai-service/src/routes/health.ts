import { Router } from "express";
import { getKnowledgeStats } from "@erika/ai-core";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    const stats = await getKnowledgeStats();
    res.json({
      status: "ok",
      service: "ai-service",
      knowledge: stats.total,
      pgvector: stats.pgvector,
    });
  } catch {
    res.status(503).json({ status: "degraded", service: "ai-service" });
  }
});
