# 简历投递材料 · AI 后端开发工程师

> 项目：中文学习 AI 辅导后端（CoupleLanguageLearning）  
> 线上 Demo：https://jaylin-love-erika.vercel.app  
> 适用岗位：平台研发 · AI 后端开发工程师（上海 · 2027 届）

---

## 一、可直接复制的简历项目块

### 中文学习 AI 辅导后端 · 个人全栈项目

**2025.06 – 2026.07** | TypeScript / Node.js / PostgreSQL / pgvector  
线上地址：https://jaylin-love-erika.vercel.app

面向真实用户的 Mandarin 学习产品，独立设计并实现可复用 AI 后端服务层，覆盖 RAG 知识库、SSE 流式对话、多 Agent 路由与可观测性，已部署至 Vercel 公网（香港节点）。

- 构建 RAG Pipeline：将 HSK 1–6 共 **4,991** 词条、**573** 语法点切分入库，生成 **5,583** 条 Knowledge Chunk；接入 OpenAI Embedding（1536 维）+ **pgvector HNSW**，生产检索 **p50 78ms**（目标 <200ms）
- 实现 Query → Embedding → Top-K 召回 → 关键词 Rerank → Prompt 注入 → LLM 生成全链路；支持按 HSK 等级过滤与增量索引（全量 ~12min → 变更秒级更新）
- 设计 SSE 流式对话服务，本地 **5 路并发 0 失败**；单次请求拆解：RAG ~80ms + DeepSeek 首 Token ~350–750ms
- 自研轻量 Multi-Agent 路由（词汇 / 语法 / 练习 / 报告 / 通用），注入差异化 Prompt；抽象 `@erika/ai-core` 共享包 + Express 微服务，支持内嵌/远程双模式部署
- 建立 AiCallLog 可观测体系；日常成本约 **$0.03/月**（10 轮/天），全量索引一次性约 **$0.006**

**技术栈：** TypeScript、Node.js、Next.js、Express、Prisma、PostgreSQL、pgvector、OpenAI Embedding、DeepSeek API、SSE、Vercel、Neon

---

### 英文精简版（可选）

**AI-Powered Mandarin Tutoring Backend** | Personal Project | 2025.06 – 2026.07  
TypeScript · Node.js · PostgreSQL · pgvector · [Demo](https://jaylin-love-erika.vercel.app)

- Built end-to-end RAG pipeline with **5,583** knowledge chunks; **78ms p50** retrieval on production with pgvector HNSW
- Implemented SSE streaming chat + 5-intent multi-agent routing; **0 errors** under 5 concurrent SSE connections
- Designed reusable `ai-core` package and optional Express microservice; delivered architecture docs, performance report, and cost analysis (~**$0.03/mo**)

---

## 二、约 300 字项目描述（网申文本框用）

独立设计并实现面向真实用户的中文学习 AI 辅导后端，完成 RAG + Agent + SSE 全链路落地并部署上线。将 HSK 1–6 词汇与语法构建为可检索知识库，共入库 5,583 条向量切片，采用 OpenAI Embedding 与 PostgreSQL pgvector（HNSW）完成相似度检索与关键词重排序，生产环境检索延迟 p50 约 78ms。基于 DeepSeek 实现流式对话（SSE），支持多路并发与上下文摘要压缩；自研轻量多 Agent 路由（词汇讲解、语法分析、对话练习、学习报告等），按意图分发并注入差异化 Prompt。将核心能力抽象为可复用 AI 服务层，支持 Next.js 内嵌与 Express 独立微服务双模式。配套可观测日志、增量索引与成本控制，日常对话成本约 $0.03/月。已交付架构文档、性能报告与技术博客，线上地址可演示。

（约 290 字，可按网申字数上限微调）

---

### 备用：120 字超短版

个人项目：中文学习 AI 后端。实现 RAG（5583 向量切片、pgvector、检索 p50 78ms）、SSE 流式对话、5 类 Agent 路由；抽象可复用服务层并上线 Vercel。技术栈 TypeScript / Node / PostgreSQL / DeepSeek / OpenAI Embedding。

---

## 三、面试常见问题与参考答案（约 15 题）

### Q1. 请用 2 分钟介绍这个项目。

这是一个面向真实用户的中文学习产品，我负责 AI 后端：把 HSK 1–6 词汇和语法做成可检索知识库，用户提问后走「意图识别 → 向量检索 → 重排序 → 拼 Prompt → DeepSeek 流式生成」。知识库约 5583 条切片，生产检索 p50 约 78ms；对话用 SSE 打字机输出；还做了 5 类 Agent 路由和可复用服务抽象，已部署到 Vercel。核心价值是完整走通 RAG + Agent + SSE 工程链路，而不是只调一个 Chat API。

---

### Q2. 为什么不用 LangChain / LangGraph？

业务意图只有五类，规则路由足够；项目跑在 Vercel Serverless 上，LangChain 包体积大、冷启动慢。我自研轻量状态机：正则意图分类 → Agent 配置（检索偏好 + Prompt 后缀）→ RAG → 生成。后续复杂意图可升级为 LLM 路由，接口已预留。

---

### Q3. RAG 的完整链路是怎样的？

1. Query 理解 / 意图分类  
2. Query Embedding（OpenAI text-embedding-3-small，1536 维）  
3. pgvector 余弦相似度 Top-K（默认 8）  
4. 关键词加权 Rerank（中文子串、词义匹配 boost）取 Top-4  
5. 拼入 System Prompt，并注入用户 HSK 等级、待复习词  
6. DeepSeek Chat 流式生成，SSE 推前端  

---

### Q4. Chunking / 切分策略是什么？

按业务实体切分，不是随意按字数切：一条 Word → 一条 chunk；一个语法点 → 一条；课程 intro / 例句各成条目。元数据含 simplified、pinyin、english、hskLevel、sourceType，便于过滤与 Rerank。

---

### Q5. Rerank 怎么做的？为什么不用 Cross-Encoder？

当前规模约 5k，向量召回后加规则 boost：命中汉字子串 +0.25，英文释义匹配 +0.15，语法点匹配 +0.2。实现简单、延迟低、无额外模型调用。数据量或噪声增大时，可接入 Cross-Encoder / Cohere Rerank，接口层已隔离检索与重排。

---

### Q6. 为什么选 pgvector，而不是 Chroma / Milvus？

与 Neon PostgreSQL、Prisma、Vercel 一体，零额外运维；5k 级 HNSW 检索 p50 <80ms 足够。Chroma 在 Serverless 难持久化，Milvus 运维重。接口封装了 Vector Store，后续可替换。

---

### Q7. SSE 流式怎么实现的？和 WebSocket 比如何？

服务端 `stream: true` 调 DeepSeek，把 delta 封装为 `event: token` 的 SSE；前端用 fetch + ReadableStream 解析（因需 POST + Cookie，不用 EventSource）。SSE 单向、实现简单、穿透代理友好，适合「服务端推 Token」；双向实时互动更适合 WebSocket。

---

### Q8. 首字延迟拆解？如何优化到 <500ms？

典型：RAG ~80ms + Prompt 组装 <10ms + DeepSeek 首 Token 350–750ms。优化方向：Embedding 查询缓存、生产节点靠近 API（已用 hkg1）、连接复用、缩短 System Prompt、非必要路径跳过 RAG。

---

### Q9. 上下文窗口超限怎么处理？

`MAX_HISTORY_MESSAGES` 截断；总字符超阈值时，对较早轮次调 LLM 生成 2–3 句摘要，以 system 消息注入，只保留最近 4 轮原文，控制 Token 成本。

---

### Q10. Agent 如何设计？如何保证回答用到检索结果？

五类 Agent：vocabulary / grammar / practice / report / general。路由规则匹配意图；各 Agent 配置 sourceTypes 与 extraPrompt。System Prompt 强制要求融入检索到的词汇/语法/例句；日志记录 ragHits，便于抽检命中率。

---

### Q11. 增量索引如何实现？解决什么问题？

全量索引约 12 分钟、有 Embedding 费用。增量模式对比 `Word.updatedAt` 与 `KnowledgeChunk.updatedAt` 及内容是否变化，只处理新增/修改；Admin 加词时同步 `reindexWord`。全量 ~12min → 变更秒级。

---

### Q12. 如何控制成本与可观测性？

Embedding 写入 DB 缓存、仅 upsert 重算；Chat `max_tokens:500`；仅长对话触发摘要。`AiCallLog` 记录 endpoint、prompt 摘要、response、latencyMs、ragHits、agentType。估算：10 轮/天约 $0.03/月；全量索引一次性约 $0.006。

---

### Q13. 微服务怎么拆的？线上为何没用独立服务？

`packages/ai-core` 承载 RAG/Agent/SSE；`services/ai-service` 为 Express 独立进程；Next.js 设 `AI_SERVICE_URL` 则代理，否则内嵌。私人站点为减运维选内嵌；架构已支持独立扩缩容。

---

### Q14. 故障与降级怎么做？

DeepSeek 失败返回预设友好文案；pgvector 异常回退内存余弦相似度；无 OpenAI Key 时用 hash embedding 保证本地可开发（生产需真实 Embedding）。

---

### Q15. 项目最大难点与收获？

难点：Vercel Serverless 下长连接 SSE、向量库选型、全量索引成本与增量更新、跨环境 Session/鉴权导致压测一致性。收获：完整经历「数据 → 向量 → 检索 → 编排 → 流式 → 观测 → 部署」闭环，理解 AI 后端是工程系统而非单次 API 调用。

---

### Q16.（加分）为什么技术栈是 TS 不是 Go？若用 Go 怎么做？

个人项目优先交付速度与全栈一体，选 TypeScript。核心能力是 RAG/Agent/SSE 架构，与语言解耦。若用 Go：Gin/Fiber 提供 SSE，pgx 调 pgvector，goroutine 处理并发流；意图路由与 Prompt 组装可直接迁移，LLM/Embedding 仍用 HTTP Client。

---

### Q17.（加分）如何继续提升回答质量？

LLM 意图分类、Cross-Encoder Rerank、Hybrid Search（BM25+向量）、对话错误记忆入库、评测集（检索命中率/忠实度）、多模态 ASR 纠音闭环。

---

## 四、面试前速查数据

| 指标 | 数值 |
|------|------|
| 知识库 Chunks | 5,583 |
| HSK 词汇 | 4,991 |
| 语法点 | 573 |
| RAG p50（生产） | 78 ms |
| SSE 并发（本地 5 路） | 0 errors |
| 日成本（10 轮） | ≈ $0.001 |
| 月成本（轻度） | ≈ $0.03 |
| Demo | https://jaylin-love-erika.vercel.app |

---

## 五、相关文档索引

| 文档 | 路径 |
|------|------|
| 架构与数据流 | `docs/AI_ARCHITECTURE.md` |
| 性能报告 | `docs/AI_PERFORMANCE.md` |
| 技术博客 | `docs/AI_BLOG.zh-CN.md` |
| 微服务说明 | `docs/AI_MICROSERVICE.md` |

---

*整理自项目实测数据与交付文档，投递前请按个人简历格式微调日期与措辞。*
