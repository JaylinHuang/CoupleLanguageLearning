## 微服务模式

AI 后端可以 **独立 Express 服务**（`services/ai-service/`）运行，也可以 **进程内** 嵌入 Next.js（默认模式）。

```
┌─────────────┐     设置了 AI_SERVICE_URL?     ┌──────────────────┐
│  Next.js    │ ─────── 是 ──────────────────▶ │  AI Service :3001 │
│  (认证/UI)  │                                │  Express + SSE    │
└─────────────┘                                └────────┬─────────┘
       │ 否（默认）                                      │
       └───────────────────────────────────────────────┘
                              │
                              ▼
                       @erika/ai-core
                              │
                              ▼
                    PostgreSQL + pgvector
```

### 共享包：`@erika/ai-core`

所有 RAG / Agent / SSE 逻辑位于 `packages/ai-core/`，Next.js 与微服务均从此包导入。

### 启用微服务模式

```bash
# 终端 1 — AI 服务
npm run ai-service:dev

# 根目录 .env
AI_SERVICE_URL=http://localhost:3001
AI_SERVICE_API_KEY=your-shared-secret
```

Next.js 负责认证（session cookie），然后代理到 AI 服务，并附带 `X-User-Id` / `X-User-Role` 请求头。

详见 [services/ai-service/README.md](../services/ai-service/README.md)。

## 增量索引

```bash
npm run ai:index                      # 全量重建索引（约 5000 词，约 12 分钟）
npm run ai:index:incremental          # 仅变更/新增内容（秒级）
npm run ai:index -- --skip-words      # 仅课程/例句
npm run ai:index -- --type=word -i    # 仅变更的词汇
```

**为什么用增量模式？** 全量索引会重新嵌入全部约 5000 个词（OpenAI API 费用 + 耗时）。增量模式比较 `Word.updatedAt` 与 `KnowledgeChunk.updatedAt`，跳过未变更条目——管理员新增一个词或编辑课程后尤其适用。
