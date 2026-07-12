import express from "express";
import cors from "cors";
import "dotenv/config";
import { chatRouter } from "./routes/chat.js";
import { ragRouter } from "./routes/rag.js";
import { knowledgeRouter } from "./routes/knowledge.js";
import { healthRouter } from "./routes/health.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const PORT = Number(process.env.AI_SERVICE_PORT ?? 3001);

app.use(cors({ origin: process.env.AI_SERVICE_CORS ?? "*" }));
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/v1", authMiddleware, chatRouter);
app.use("/v1/rag", authMiddleware, ragRouter);
app.use("/v1/knowledge", authMiddleware, knowledgeRouter);

app.listen(PORT, () => {
  console.log(`AI service listening on http://localhost:${PORT}`);
});
