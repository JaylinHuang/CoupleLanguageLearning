import { Router } from "express";
import { upsertKnowledge, getKnowledgeStats, reindexWord } from "@erika/ai-core";
import { requireAdmin } from "../middleware/auth.js";

export const knowledgeRouter = Router();

knowledgeRouter.get("/stats", requireAdmin, async (_req, res) => {
  const stats = await getKnowledgeStats();
  res.json(stats);
});

knowledgeRouter.post("/index", requireAdmin, async (req, res) => {
  const { action, document, sourceId } = req.body as {
    action: "upsert" | "reindex-word";
    document?: Parameters<typeof upsertKnowledge>[0];
    sourceId?: string;
  };

  if (action === "upsert" && document) {
    const id = await upsertKnowledge(document);
    res.json({ ok: true, id });
    return;
  }

  if (action === "reindex-word" && sourceId) {
    const id = await reindexWord(sourceId);
    if (!id) {
      res.status(404).json({ error: "Word not found" });
      return;
    }
    res.json({ ok: true, id });
    return;
  }

  res.status(400).json({ error: "Invalid action" });
});
