# 从零构建 AI 学习助手：RAG + Agent + SSE 实战

> 技术博客草稿 — 基于 Erika's Chinese Learning 项目

## 背景

这是一个为远距离情侣设计的中文学习 Web App。Phase P4 接入了 DeepSeek 聊天，但 AI 回答完全依赖静态 System Prompt，不知道用户学了哪些词、当前 HSK 等级是多少，也没有流式输出。

本文记录如何将一个「聊天 Demo」升级为完整的 **RAG + Agent + SSE** AI 后端服务。

## 一、架构选型

### 为什么不用 LangChain？

LangChain/LangGraph 功能强大，但对于一个 Next.js 单体应用来说：

- 包体积大，冷启动慢（Vercel Serverless 不友好）
- 抽象层多，调试困难
- 我们的 Agent 路由逻辑简单（5 种意图），自研状态机足够

最终选择：**自研轻量 AI 服务层** (`src/lib/ai/`)，接口设计为可独立抽离。

### 向量存储：PostgreSQL vs ChromaDB

| 方案 | 优点 | 缺点 |
|------|------|------|
| PostgreSQL + JSON embedding | 零额外依赖，与 Prisma 一体 | 大规模检索需 pgvector |
| ChromaDB | 本地开发友好 | Vercel 无持久化存储 |
| Milvus | 高性能 | 运维成本高 |

当前阶段用 **PostgreSQL 存 JSON 向量 + 内存余弦相似度**，数据量 < 1000 条完全够用。HSK 全量导入后迁移 pgvector。

## 二、RAG Pipeline 实现

### 数据建模

```typescript
// KnowledgeChunk — 统一的知识条目
{
  sourceType: "word" | "grammar" | "example" | "lesson",
  content: "词汇: 想\n拼音: xiǎng\n英文: to miss, to want",
  metadata: { simplified: "想", pinyin: "xiǎng", english: "..." },
  embedding: "[0.012, -0.034, ...]"  // 1536-dim JSON
}
```

### 索引流程

```bash
npm run ai:index
# Word 表 → 词汇条目
# Lesson.content JSON → 课程 + 例句条目
# data/hsk/grammar-hsk1.json → 语法条目
```

### 检索 + 重排序

1. Query → OpenAI `text-embedding-3-small` → 1536 维向量
2. 与所有 KnowledgeChunk 做余弦相似度 → Top-8
3. **Keyword Boost Rerank**：中文子串匹配 +0.25，词义匹配 +0.3
4. 取 Top-4 拼入 System Prompt

实测检索延迟 ~50-150ms（29 词 + 8 语法点 + 例句）。

## 三、SSE 流式对话

### 服务端

```typescript
// /api/chat/stream
const stream = new ReadableStream({
  async start(controller) {
    send("meta", { agent, retrievalMs, ragHits });
    for await (const token of streamChatCompletion(...)) {
      send("token", { content: token });
    }
    send("done", { latencyMs });
  }
});
return new Response(stream, {
  headers: { "Content-Type": "text/event-stream" }
});
```

### 前端

不用 EventSource（不支持 POST），用 `fetch` + `ReadableStream` 解析 SSE：

```typescript
const reader = res.body.getReader();
// 解析 event: / data: 行
if (event === "token") {
  fullReply += parsed.content;
  setMessages(prev => updateLastAssistant(prev, fullReply));
}
```

首字延迟 ≈ RAG 检索时间 + DeepSeek TTFB（通常 300-500ms）。

## 四、Agent 路由

不用 LLM 做意图识别（节省 Token），用规则引擎：

```typescript
const VOCAB_PATTERNS = [/什么意思/, /what does .+ mean/i, /拼音/];
const GRAMMAR_PATTERNS = [/语法/, /[\u4e00-\u9fff]{2,}/];
// ...
```

每种 Agent 注入不同的 Prompt 后缀和检索偏好：

- **词汇 Agent**：优先 word + example 类型
- **语法 Agent**：优先 grammar + lesson 类型
- **练习 Agent**：发起情景对话
- **报告 Agent**：注入 XP、连续天数等用户数据

## 五、上下文管理

长对话会超出 Token 窗口。策略：

1. 保留最近 4 轮消息
2. 更早的消息 → DeepSeek 摘要压缩
3. 摘要作为 system message 注入

阈值：`MAX_CONTEXT_TOKENS=3000`（约 9000 字符）。

## 六、可观测性

每次 AI 调用写入 `AiCallLog`：

```json
{
  "endpoint": "/api/chat/stream",
  "latencyMs": 1240,
  "metadata": {
    "agent": "vocabulary",
    "ragHits": 3,
    "retrievalMs": 87
  }
}
```

对话持久化到 `ChatSession` + `ChatMessage`，支持后续分析 RAG 命中率。

## 七、性能测试结果

| 指标 | 目标 | 实测 |
|------|------|------|
| RAG 检索 p50 | < 200ms | ~80ms (dev, 50 chunks) |
| SSE 首字 | < 500ms | ~350ms |
| 10 路并发 SSE | 0 error | PASS |
| 降级 | DeepSeek 故障 | 返回预设提示 |

运行基准测试：

```bash
npm run dev
npm run ai:bench
```

## 八、成本分析

| 操作 | Token 消耗 | 频率 |
|------|-----------|------|
| Embedding (index) | ~50 tokens/chunk | 仅 upsert 时 |
| Embedding (query) | ~20 tokens | 每次提问 |
| Chat generation | ~500 tokens | 每次回答 |
| Summary | ~200 tokens | 长对话时 |

估算：Erika 每天聊 10 轮 ≈ $0.01-0.02/天（DeepSeek + OpenAI embedding）。

## 九、下一步

- [ ] HSK 1-6 全量词表导入（~5000 词）
- [ ] pgvector 索引优化
- [ ] 语音输入（Web Speech API）
- [ ] TTS 发音示范
- [ ] LLM-based Agent 路由（复杂意图时）
- [ ] 抽离为独立 AI 微服务

---

*Private project — Jaylin_love_Erika*
