## Why

当前产品是单租户、双账号写死的中文情侣辅导站（Lin/Erika），无法自运营服务多对情侣，也无法在不挖数据模型的前提下预留第二科目。需要重构为「自运营情侣学习平台」：严格 1:1 成对注册、科目与课程并行、共享 HSK + 情侣私有语料，并支持老师用文本资料训练私有 Agent；同时拆出本地运营后台与可选的高性能导入 Worker 练功平面。

## What Changes

- **BREAKING**：登录与身份模型从固定 `lin`/`erika` username 改为邮箱账号；`ADMIN` 能力拆为平台运营（PLATFORM_ADMIN）与情侣内老师（TUTOR）。
- 引入 **Couple（1 Tutor + 1 Learner）**、严格双邮箱验证后才 ACTIVE；一人全局仅属一对。
- 引入 **Subject / Course / Enrollment**，支持并行多课；共享课程模板 + 情侣私有课。
- 老师模板：**独立 templateId**、仅所有者可改；他人按 ID **钉版本引用**；若要改动必须分叉为自有新模板，绝不写回所有者。
- 内容原子 **LearningItem**（中文扩展 + generic 兜底）；Review v1 按 learner+item 全局计进度。
- 知识库：**SHARED（如 HSK）∪ COUPLE 私有**；私有永不升共享；运营者不可读私有正文。
- 老师「训练」Agent：上传任意文本（UTF-8 校验失败打回）→ 切块 → 仅写入 COUPLE RAG；导入历史可编辑/整单回退；进行中取消=整单回退。
- 用户站公网部署；**PLATFORM_ADMIN 运营后台仅本地运行**（不部署为公网站点）。
- 并行 **Go 导入 Worker 平面**（Redis Streams + Outbox + Mock Embed 压测）：产品可先用 TS 队列保底，练功/高性能路径用 Go。

## Capabilities

### New Capabilities

- `couple-identity`: 成对注册、邮箱唯一、双验证、CoupleMembership 1:1、角色 TUTOR/LEARNER/PLATFORM_ADMIN
- `course-enrollment`: Subject、Course（共享模板/私有）、Enrollment 并行多课、模板 ID 钉版本引用与分叉
- `learning-content`: LearningItem、中文扩展、generic 兜底、SRS 挂 item、情侣私有 Lesson
- `knowledge-scope`: SHARED/COUPLE 语料作用域、检索谓词、Ops 不可读私有正文
- `tutor-corpus-import`: UTF-8 校验、切块、导入队列、历史编辑/整单回退、老师文本训练
- `ops-console`: 本地 PLATFORM_ADMIN 后台（元数据治理、模板/HSK 运维，无私有正文）
- `import-worker-plane`: Go Worker、Redis Streams、Outbox、限流与 Mock 压测矩阵（练功/高性能路径）

### Modified Capabilities

- （无既有 `openspec/specs/` 基线；行为变更通过上述新能力规格覆盖，并替换现硬编码双用户假设。）

## Impact

- **数据**：`prisma/schema.prisma` 大改与迁移；现有 Erika/Lin 种子迁为默认 Couple + chinese Course。
- **鉴权/路由**：middleware、登录、现 `/admin/*` 迁为 Tutor 域；新建本地 Ops 应用或入口。
- **AI**：`packages/ai-core` Prompt/检索按 couple+subject 作用域；导入禁 hash 伪向量降级。
- **部署**：用户站仍 Vercel；Ops 本地；可选 Redis + Go workers（Docker/VPS）。
- **文档**：维护者/用户指南与注册、隐私、模板引用说明需同步。
