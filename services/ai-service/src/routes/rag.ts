import { Router } from "express";
import { retrieve } from "@erika/ai-core";

export const ragRouter = Router();

ragRouter.post("/search", async (req, res) => {
  const { query, hskLevel, topK, rerankTopK } = req.body as {
    query?: string;
    hskLevel?: number;
    topK?: number;
    rerankTopK?: number;
  };

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "query required" });
    return;
  }

  const { results, retrievalMs } = await retrieve(query, { topK, rerankTopK, hskLevel });
  res.json({ results, retrievalMs });
});
