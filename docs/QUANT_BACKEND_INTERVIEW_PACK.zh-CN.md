# 量化后端面试材料 · 中文学习 AI 辅导后端

> 项目：Jaylin_love_Erika（中文学习 AI 辅导后端 · 全栈）  
> 线上 Demo：https://jaylin-love-erika.vercel.app  
> 适用岗位：**量化后端 / 平台后端 / 低延迟服务研发**  
> 配套：简历项目块见 `docs/RESUME_INTERVIEW_PACK.md`；性能实测见 `docs/AI_PERFORMANCE.md`

本文面向投递量化后端时「讲透这个项目」：先建立可讲清的工程故事，再准备高频追问与诚实边界（避免被深挖穿帮）。

---

## 一、投递量化岗位时怎么讲这个项目

### 1.1 一句话定位（开场 15 秒）

> 这是一个面向真实用户的学习产品，我独立做了 AI 后端：把结构化知识做成可检索向量库，打通「检索 → 编排 → 流式输出 → 可观测」全链路；核心能力是 **低延迟检索、可靠降级、数据管线与成本可控**，而不是只调一次 Chat API。

### 1.2 与量化后端的能力映射（面试官听这个）

| 量化后端常见要求 | 本项目可对应的证据 |
|------------------|-------------------|
| 延迟与分位数意识（p50/p99） | 生产 RAG `retrievalMs` p50 **78ms**，p99 **1042ms**；会拆瓶颈（Embedding RTT vs ANN） |
| 数据管线 / 批处理 | HSK 全量索引（~5k 条）、批大小 50、增量 upsert、实体级切分 |
| 索引与检索 | PostgreSQL + **pgvector HNSW**（cosine），Top-K 召回 + 规则 Rerank |
| 可靠性与降级 | LLM 失败友好文案；pgvector 失败回退内存余弦；无 Key 时 hash embedding（仅开发） |
| 可观测性 | `AiCallLog`：endpoint / latency / ragHits / agent / retrievalMs |
| 服务边界与复用 | `@erika/ai-core` 共享包；可选 Express 微服务（内嵌 / 远程双模式） |
| 并发与流式 IO | SSE 流式对话；本地 5 路并发 0 失败 |

**不要硬说成交易系统**：没有撮合、风控、行情网关。正确叙事是「用同一套系统思维做了检索与生成服务」，并主动说明规模（5k 向量）与边界。

### 1.3 简历数字速查（与实测对齐）

| 指标 | 数值 | 备注 |
|------|------|------|
| 知识库 Chunks | **5,583** | 性能报告快照（word 4,994 + grammar 573 + lesson 4 + example 12） |
| 简历「词汇」写法 | 约 **4,991–4,994** | 与报告差几个可说「按当时快照」 |
| Embedding | OpenAI `text-embedding-3-small`，**1536** 维 | |
| 召回 / 重排 | Top-**8** → Rerank Top-**4** | |
| 生产 RAG p50 | **78 ms** | 目标 &lt;200ms，PASS |
| 生产 RAG p99 | **1042 ms** | 多为 Embedding API 冷启动/抖动 |
| SSE 首字（本地） | p50 **840 ms** | 目标 &lt;500ms 未在本地达标；生产预期 400–600ms，未自动化验收 |
| SSE 并发 | 本地 **5 路 0 errors** | 生产 10 路未自动化跑通 |
| 日常成本 | 约 **$0.03/月**（10 轮/天） | 定价估算，非账单实测 |
| 全量索引 | 约 **12 min**；费用约 **$0.006** | 脚本说明/估算 |
| 部署 | Vercel `hkg1` + Neon `ap-southeast-1` | |

---

## 二、项目全方位总结

### 2.1 业务与系统边界

- **用户侧**：课程、复习（SRS）、作业、练习（听写/写字/角色扮演等）、AI 对话辅导。
- **你主打的后端能力**：RAG 知识库、意图路由、SSE 对话、索引管线、调用日志、邮件日报/周报（Cron）。
- **真实约束**：私人站点、Serverless（Vercel）、Neon 托管 Postgres、第三方 Embedding/LLM API。

### 2.2 总体架构

```
Browser
  → Next.js（鉴权 / Cookie）
      → [默认] 进程内 @erika/ai-core
      → [可选] AI_SERVICE_URL → Express :3001（同一套 ai-core）
            → OpenAI Embeddings
            → Neon PG + pgvector (HNSW)
            → DeepSeek Chat (stream)
  ← SSE: meta / token / done | error
```

关键路径：

| 层级 | 路径 / 模块 |
|------|-------------|
| 入口 | `src/app/api/chat/stream/route.ts` |
| 共享核心 | `packages/ai-core/`（`@erika/ai-core`） |
| 检索 | `retriever.ts` + `vector-store.ts` |
| 管线 | `rag-pipeline.ts` → `handlers/chat.ts` |
| 路由 | `agents/router.ts` |
| 观测 | `observability.ts` → `AiCallLog` |
| 索引 | `scripts/index-knowledge.ts`、`scripts/import-hsk.ts` |
| 可选微服务 | `services/ai-service/` |

### 2.3 RAG 全链路（务必背熟）

1. **意图分类** `classifyIntent`：正则优先级 report → practice → vocabulary → grammar → general  
2. **用户上下文** `getUserLearningContext`：HSK、XP、streak、待复习词  
3. **Query Embedding**：`text-embedding-3-small` → 1536 维向量  
4. **ANN 召回**：`embedding_vec <=> query`，cosine，Top-K=8；可选 `hskLevel` 过滤  
5. **关键词 Rerank**：对 simplified / english / pinyin / grammarPoint / 中文子串加 boost，取 Top-4  
6. **Prompt 组装**：检索上下文 + Agent `extraPrompt` + 学习上下文  
7. **流式生成**：DeepSeek `stream: true`，SSE 推 token；`max_tokens: 500`  
8. **落库观测**：`ChatMessage` + `logAiCall`（含 `retrievalMs`、`ragHits`、`agent`）

### 2.4 切分与索引策略

- **实体级 Chunking**（非随意按字数切）：一词一条、一语法点一条、课程 intro / 例句各成条目。  
- **元数据**：simplified、pinyin、english、hskLevel、sourceType 等，服务过滤与 Rerank。  
- **全量**：批大小 50，顺序 upsert；帮助文案约 12 分钟。  
- **增量**：对比 `updatedAt` / 内容哈希类逻辑，只重算变更；Admin 可单词 `reindexWord`。  
- **双写**：JSON `embedding` + SQL 列 `embedding_vec`（Prisma 外 SQL 建 HNSW，避免 `db push` 误删向量列）。

### 2.5 向量检索与降级

- **主路径**：pgvector HNSW + `vector_cosine_ops`；score ≈ `1 - distance`。  
- **降级**：pgvector 失败 → 全表（过滤后）内存余弦，O(n)；规模 5k 仍可接受。  
- **开发降级**：无 OpenAI Key → 确定性 hash 伪向量（**不可当生产语义检索**）。

### 2.6 Multi-Agent（轻量，非 LangChain）

- 五类：vocabulary / grammar / practice / report / general。  
- **实际生效**：差异化 `extraPrompt` + System Prompt 模式提示 + 用户 HSK/待复习词。  
- **实现缺口（面试要诚实）**：Agent 配置里的 `sourceTypes` **尚未传入** `retrieve`，检索侧目前主要靠 `hskLevel`，不是完整的「按意图过滤 sourceType」。

### 2.7 SSE 与并发

- 服务端把模型 delta 写成 `event: token`；另有 `meta`（agent、retrievalMs、ragHits）、`done`、`error`。  
- 前端用 `fetch` + `ReadableStream`（需 POST + Cookie，不用 `EventSource`）。  
- 本地 5 路并发读完流 **0 errors**；生产多实例无共享会话状态瓶颈，但未做完整 10 路自动化验收。

### 2.8 可观测与成本

- **AiCallLog**：延迟、prompt/response 截断、metadata（agent、ragHits、retrievalMs）。  
- **注意**：流式路径上 `tokensOut` 更接近「拼接字符数」，不是精确 tokenizer 计量。  
- **成本手段**：Embedding 入库缓存、Chat `max_tokens` 上限、长上下文才摘要、增量索引避免全量重跑。

### 2.9 周边系统（可一句带过）

- 学习产品：SRS、作业、错题进复习、底栏导航等。  
- Cron：北京时间每日 23:00 日报、周一 00:00 周报（邮件汇总；交作业不即时邮件；学习愿望仍即时通知）。  
- 投递时重点仍放在 **RAG / 延迟 / 索引 / 可靠性**。

---

## 三、面试叙事模板（2 分钟 / 5 分钟）

### 3.1 两分钟版

「我做了一个真实在用的中文学习产品的 AI 后端。知识库把 HSK 1–6 词汇和语法切成约 5600 条 chunk，用 OpenAI Embedding + Postgres pgvector（HNSW）做相似度检索，再加一层中文关键词重排，生产检索 p50 大约 78ms。对话走 SSE：意图路由 → RAG → DeepSeek 流式输出，并把 retrievalMs、ragHits 打进 AiCallLog。核心工程点是：实体级切分与增量索引、向量检索与内存降级、流式 IO 与并发验证、以及在 Serverless 约束下把服务抽成可复用的 ai-core。规模不大，但链路完整，也做过分位数和成本估算。」

### 3.2 五分钟版（加三个技术点）

在两分钟版后展开：

1. **延迟拆解**：`retrievalMs` 含 Embedding RTT + ANN + Rerank；p50~80ms 达标，p99 偶发秒级主要在 Embedding API，不是 HNSW 本身。端到端首字主要被 DeepSeek TTFB（约 350–750ms）主导。  
2. **质量 vs 延迟**：5k 规模未上 Cross-Encoder；用元数据 boost 换低延迟。若噪声上升，会在接口层换 Rerank，而不改存储。  
3. **演进**：代码已支持 Express 拆分；生产为减运维走内嵌。下一步会接上 Agent 的 sourceType 过滤、Hybrid Search、离线评测集。

---

## 四、高频面试题与参考回答

> 回答原则：**先结论，再机制，再数字，再边界**。数字与 `AI_PERFORMANCE.md` 一致；不确定就说「报告里是这样测的 / 代码现状是这样」。

### A. 开场与动机

#### Q1. 用两分钟介绍这个项目。

见 §3.1。强调「工程闭环」与「可测延迟」，少讲恋爱产品故事。

#### Q2. 为什么适合量化后端？你不是做交易的啊？

量化后端本质是：**低延迟服务、可靠数据路径、可观测、可控资源**。我用同一套方法论做了检索与生成后端：定义 SLA（RAG p50&lt;200ms）、测分位数、拆瓶颈、做降级与批处理索引。业务域不同，但工程肌肉可迁移；我会主动说明没有撮合/风控经验，但有服务端延迟与数据管线实践。

#### Q3. 为什么不用 LangChain？

意图空间小（五类），规则路由足够；Serverless 对包体与冷启动敏感。自研状态机：正则分类 → Agent 配置 → RAG → 生成。复杂意图可升级 LLM 路由，接口已分层。

---

### B. 延迟、性能与量化感

#### Q4. 你说的 p50 78ms 是怎么测的？包含什么？

`POST /api/rag/search`，固定 query，读响应里的 `retrievalMs`（`performance.now()` 包住 embed + search + rerank）。生产 Vercel 采样 10 次：p50=78，p99=1042，errors=0。目标 &lt;200ms 算 PASS。  
**注意**：这是检索段，不是端到端聊天首字。

#### Q5. p99 为什么到 1 秒？HNSW 不是很快吗？

5k 级 HNSW 查询本身通常远低于 100ms。p99 尖刺更符合 **OpenAI Embedding 冷启动/网络抖动**。面试可补：若要压 p99，应对 query embedding 做缓存/本地小模型、连接复用、超时与重试策略，并对 ANN 与 embed 分别打点。

#### Q6. 端到端首字延迟怎么拆？

典型：RAG 75–80ms + Prompt/路由 &lt;10ms + DeepSeek 首 token 350–750ms → 合计约 430–840ms。本地 SSE p50 实测 840ms（含 dev 冷启动）。生产预期更好，但自动化跨环境 Cookie 未完成验收——**不要硬说「生产已稳定 &lt;500ms」**。

#### Q7. 如何继续把延迟打下去？（量化岗爱追）

短中期：  
1）Query Embedding 缓存（相同 query / 规范化后命中）；  
2）热点词预计算；  
3）缩短 System Prompt；  
4）report 类意图可跳过或缩小 RAG；  
5）把 embed 与 ANN 分 metric；  
6）区域就近（已用 hkg1）。  
中长期：本地 embedding、连接池与 HTTP keep-alive、必要时同步改异步流水线（先回 meta，再并行准备）。

#### Q8. Top-K=8、Rerank=4 怎么定的？

经验值：召回稍宽防漏，重排收窄控 Prompt Token 与噪声。没有大规模离线网格搜索；若做量化式优化，会建评测集，扫 K 与 boost 权重，看命中率 vs `retrievalMs`/token 成本的 Pareto。

---

### C. 向量检索、索引与数据库

#### Q9. 为什么选 pgvector，不选 Milvus / 专用向量库？

与现有 Neon Postgres、Prisma、业务表一体，零额外集群；5k 规模 HNSW 足够。Milvus 运维重；Chroma 在 Serverless 持久化不便。检索接口已封装，后续可替换存储实现。

#### Q10. HNSW 原理用一句话说？参数调了吗？

HNSW 是多层图上的近似最近邻：上层跳远、下层精修，查询复杂度近似对数级。当前建索引用 pgvector 默认参数，**未调** `m` / `ef_construction` / `ef_search`。规模小，默认够用；若召回率不足会先抬 `ef_search`，再评估建索时间与内存。

#### Q11. 余弦距离在 SQL 里怎么表达？score 怎么算？

使用 `<=>`（cosine distance）排序 `LIMIT K`；业务 score 用 `1 - distance`，再叠加关键词 boost 后重排。

#### Q12. 精确搜索和 ANN 怎么选？

5k 全量暴力余弦也能做，但走 HNSW 是为了：**统一生产路径、练索引与降级、为规模增长留余量**。诚实说：当前规模下 ANN 的绝对收益有限，价值在工程完整性与可演进。

#### Q13. 为什么 Chunk 按实体切，不按固定 Token 窗？

词汇/语法本身是原子教学单元；按实体切元数据干净，过滤与 Rerank 更准，也避免半截释义。课程例句单独成 chunk，利于情景问答。

#### Q14. 增量索引如何保证「变更秒级」？

对比源数据与 `KnowledgeChunk` 的更新时间/内容是否变化，只对脏数据重新 embed + upsert；Admin 热路径可单条 `reindexWord`。全量仍约十几分钟且有 Embedding 费用，故日常走增量。

#### Q15. Prisma 和 pgvector 怎么共存？踩过什么坑？

`embedding_vec` 与 HNSW 用手工 SQL 维护；避免对生产盲目 `prisma db push`，否则可能丢掉非 Prisma 管理的向量列。业务字段走 Prisma，向量检索走 `$queryRaw` / 封装的 vector-store。

---

### D. RAG 质量与 Agent

#### Q16. Rerank 怎么做？为什么不用 Cross-Encoder？

规则 boost：命中汉字/释义/拼音/语法点加分，再排序截断。延迟低、无额外模型调用，适合 5k 与 Serverless。数据变脏或规模上来再接 Cross-Encoder / 托管 Rerank，接口已隔离「召回 / 重排」。

#### Q17. 如何证明检索有用，而不是模型瞎编？

System Prompt 要求融入检索片段；日志记 `ragHits`；人工抽检。**缺口**：没有自动化 hit-rate / faithfulness 评测集——若被问到，承认并给出建设方案（金标 query→应命中 sourceId）。

#### Q18. Agent 的 sourceTypes 真的生效了吗？

配置存在，但当前 **未传入 retrieve**。生效的是 Prompt 差异化与用户 HSK 过滤。这是已知改进点：接上后可减少跨类型噪声（例如词汇问答少捞纯语法长文）。

#### Q19. 幻觉怎么控？

检索注入 + Prompt 约束 + 低 `max_tokens`；关键事实以知识库为准。未做 groundedness 自动评分；生产还有 LLM 失败时的固定降级文案。

---

### E. 流式、并发与可靠性

#### Q20. SSE 和 WebSocket 怎么选？

本场景是服务端单向推 token，SSE 足够、实现简单、代理友好。需要双向实时（如协同编辑、推送指令）再上 WebSocket。

#### Q21. Serverless 上跑长连接有什么风险？

函数超时、空闲断开、冷启动影响首包；多实例无粘滞时要保证会话状态在 DB 而非内存。做法：尽快出首包 meta、控制生成长度、会话落库、监控 `done.latencyMs`。

#### Q22. 并发测试说明什么、不能说明什么？

说明：同进程/本地环境下 5 路同时 SSE **无错误读完**。不能说明：生产极限 QPS、限流、下游 API 配额、数据库连接池打满。量化场景要补：连接池上限、超时、重试幂等、熔断。

#### Q23. 故障降级链路？

| 故障 | 行为 |
|------|------|
| DeepSeek 失败 | 返回预设友好回复 |
| pgvector 异常 | 内存余弦回退 |
| 无 Embedding Key | hash 伪向量（仅本地开发可接受） |
| 日志写入失败 | 不影响主对话 |
| 摘要失败 | 退化为截断历史 |

#### Q24. 有没有重试、熔断、限流？

当前基本是「失败即降级」，**没有**完整的指数退避重试/熔断/令牌桶。面试可主动说：生产级会按错误类型区分可重试（429/5xx）与不可重试，并对 Embedding/LLM 设独立超时预算。

---

### F. 成本、观测与工程化

#### Q25. 成本 $0.03/月怎么算的？

按公开定价 × 假设日 10 轮（embedding + 约 500 token 生成）估算，见性能报告；不是云账单回灌。`AiCallLog` 是未来接真实用量的钩子，但 tokens 计量还需对齐 tokenizer。

#### Q26. AiCallLog 能支撑什么分析？

延迟分布、agent 分布、空检索比例、异常 endpoint。做不好的：精确 token 账单、自动告警大盘（目前无独立监控系统）。

#### Q27. 微服务拆了却为什么生产内嵌？

`ai-core` 已可被 Express 挂载；私人站点优先运维简单与冷启动。架构价值是：**同一套逻辑可水平拆出**，鉴权经 Bearer + 用户头代理。量化团队常类似：策略逻辑库 vs 独立行情/下单进程。

#### Q28. 技术栈为什么是 TS？量化很多用 C++/Go？

个人全栈交付与 Next 生态选 TS。迁移叙事：核心是协议与数据路径；Go 可用 Gin + pgx + goroutine 推 SSE；热点路径若要极致延迟再考虑原生。重点展示 **会做边界与性能分析**，而非绑定语言。

---

### G. 设计题 / 深挖题（量化后端常见变形）

#### Q29. 如果知识库到 500 万条，你怎么改？

分层：专用向量库或分区；HNSW 参数与内存规划；Hybrid（BM25+向量）；分级缓存；异步索引队列；检索与生成服务拆分扩容；离线评测与线上采样；严格超时预算（embed / ann / llm 分阶段）。

#### Q30. 如何设计「检索延迟 SLA」监控？

按阶段埋点：`embed_ms`、`ann_ms`、`rerank_ms`、`llm_ttfb_ms`；上报 p50/p95/p99；告警阈值；用 AiCallLog 或指标系统；区分区域与模型版本；对回归用固定 query 金标集每日跑。

#### Q31. Embedding 维度 1536，能否降维？

可：更小模型 / Matryoshka 截断 / PCA——换召回率。当前优先质量与实现简单；若成本或存储成瓶颈再评估，并用评测集验证。

#### Q32. 如何防止 Prompt 注入或越权读库？

会话鉴权（Cookie/角色）；微服务 Bearer；检索只返回当前用户等级可见知识；不把系统密钥放进 Prompt；管理接口与 Cron 秘钥保护。量化类比：权限与审计，不信任客户端输入。

#### Q33. 项目最大技术难点？

1）Serverless 下流式与鉴权压测一致性；  
2）向量列与 ORM 迁移安全；  
3）在「延迟 / 质量 / 成本」之间做可解释取舍（规则 Rerank、增量索引、max_tokens）。  
收获：完整闭环 + 用分位数说话。

#### Q34. 如果重来，你会先做什么？

先做小型离线评测集与分阶段耗时埋点；尽早接通 Agent `sourceTypes`；生产 SSE 用真实 Cookie 做自动化；避免文档/README 与实现状态不一致。

---

## 五、追问「压力测试」——诚实边界清单

面试前默念：**哪些能硬刚，哪些要软化**。

| 说法 | 建议口径 |
|------|----------|
| 生产 RAG p50 78ms | ✅ 可讲，引用性能报告 |
| SSE &lt;500ms 已达标 | ⚠️ 本地 840ms；生产预期未自动化验收 |
| 10 路生产并发 0 失败 | ⚠️ 仅本地 5 路；生产未跑 |
| Multi-Agent 按类型过滤检索 | ⚠️ Prompt 侧有；sourceTypes 未接线 |
| 微服务已在生产运行 | ⚠️ 代码具备；典型部署是内嵌 |
| 命中率 90%+ | ❌ 无自动评测，勿编 |
| tokens 精确计量 | ⚠️ 流式路径偏字符长度 |
| 词汇 4991 vs 4994 | ✅ 「报告快照约 4994；简历取整/旧快照」 |

---

## 六、反问面试官（显得懂后端）

1. 贵团队对内部服务的延迟 SLA 如何拆分（网关 / 核心 / 依赖）？p99 超标如何归因？  
2. 行情或特征检索是否用 ANN/倒排？如何做版本与回滚？  
3. 对第三方 API（或旁路服务）的超时、重试、熔断预算怎么定？  
4. 新毕业/校招在团队里更看重「夯实基础组件」还是「快速交付业务」？

---

## 七、面试前 30 分钟速记卡

```
链路: Intent → Embed(1536) → HNSW Top8 → Keyword Rerank Top4 → Prompt → DeepSeek SSE
规模: 5583 chunks | 词~5k | 语法 573
延迟: RAG p50 78ms / p99 ~1s(embed) | 端到端首字 ≈ RAG + 350–750ms LLM
可靠: LLM 降级文案 | pgvector→内存余弦 | 日志失败不挡主路径
工程: ai-core 复用 | 增量索引 | AiCallLog | 可选 Express
边界: sourceTypes 未接线 | SSE&lt;500 未生产自动化验收 | 成本为估算
Demo: https://jaylin-love-erika.vercel.app
```

---

## 八、相关文档

| 文档 | 用途 |
|------|------|
| `docs/RESUME_INTERVIEW_PACK.md` | 简历项目块 + AI 岗通用问答 |
| `docs/AI_ARCHITECTURE.zh-CN.md` | 架构与数据流 |
| `docs/AI_PERFORMANCE.md` | **延迟/并发/成本权威数字** |
| `docs/AI_MICROSERVICE.zh-CN.md` | 双模式部署 |
| `docs/AI_BLOG.zh-CN.md` | 对外叙述草稿 |
| `docs/LIN_MAINTAINER_GUIDE.zh-CN.md` | 全站维护细节 |

---

*数字以 `docs/AI_PERFORMANCE.md`（2026-07-12）与当前代码为准。投递前若重新跑 bench，请同步更新本文与简历。*
