# Jaylin_love_Erika — 维护者技术文档

> 面向：Lin（管理员 / 开发者）  
> 项目路径：`ErikasChineseLearning`  
> 线上地址：https://jaylin-love-erika.vercel.app

---

## 一、项目概览

这是一个专为 Erika 定制的私人中文学习 Web 应用，采用 **前后端一体的 Next.js 全栈架构**，部署在 **Vercel**，数据库使用 **Neon PostgreSQL**，面向菲律宾学习者、中国管理员跨地区访问。

**设计原则**：稳定优先、场景驱动（情侣交流 > 家庭礼仪 > HSK 系统进度）、鼓励型学习（无竞争排行榜）。

---

## 二、技术栈总览

| 层级 | 技术 | 版本 / 说明 |
|------|------|-------------|
| 框架 | **Next.js** (App Router) | 15.x |
| 语言 | **TypeScript** | 全项目类型安全 |
| UI | **React 19** + **Tailwind CSS 4** | 温馨情侣风自定义主题色 |
| 字体 | Inter + Noto Sans SC (Google Fonts) | 英文 + 简体中文 |
| ORM | **Prisma** | 5.x |
| 数据库 | **PostgreSQL** (Neon) | 亚太新加坡区域 |
| 认证 | **bcryptjs** + **jose** (JWT) | Cookie 会话，双账号密码 |
| AI | **DeepSeek API** | `deepseek-chat` 模型 |
| 邮件 | **nodemailer** | QQ 邮箱 SMTP |
| 文件存储 | **Vercel Blob** | 作业录音；`BLOB_STORE_ID` + OIDC |
| 部署 | **Vercel** | 区域 `hkg1`（香港） |
| PWA | `manifest.json` + `sw.js` | 可添加到手机主屏幕 |

---

## 三、项目目录结构

```
ErikasChineseLearning/
├── prisma/
│   ├── schema.prisma      # 数据模型
│   └── seed.ts            # 种子数据（用户、词、课、Lin 人物卡）
├── src/
│   ├── app/               # Next.js 页面与 API
│   │   ├── actions/       # Server Actions（登录、学习、作业）
│   │   ├── api/           # API Routes（AI 聊天、录音上传）
│   │   ├── admin/         # Lin 管理后台
│   │   ├── learn/         # 课程学习
│   │   ├── review/        # 间隔重复复习
│   │   ├── listening/     # 听力练习
│   │   ├── speaking/      # 跟读录音
│   │   ├── typing/        # 拼音打字
│   │   ├── practice/ai/   # AI 陪练
│   │   ├── culture/       # 文化礼仪
│   │   ├── homework/      # 作业
│   │   └── ...
│   ├── components/        # 可复用 UI 组件
│   └── lib/               # 工具库（数据库、认证、SRS、邮件等）
├── public/
│   ├── manifest.json      # PWA 配置
│   └── sw.js              # Service Worker（离线缓存）
├── .env                   # 本地环境变量（勿提交 Git）
├── vercel.json            # Vercel 构建与区域配置
├── DEPLOY.md              # 部署指南
└── BLOB_SETUP.md          # Blob 录音存储说明
```

---

## 四、各功能模块与技术实现

### 4.1 认证与权限

| 项目 | 实现 |
|------|------|
| 登录 | `src/app/actions/auth.ts` — Server Action + bcrypt 密码校验 |
| 会话 | `src/lib/auth.ts` — jose 签发 JWT，存入 HTTP-only Cookie（30 天） |
| 路由保护 | `src/middleware.ts` — 检查 Cookie 是否存在；未登录跳转 `/login` |
| 角色 | `User.role`：`LEARNER`（Erika）/ `ADMIN`（Lin） |
| 权限分流 | `requireLearner()` / `requireAdmin()`；Lin 访问 `/` 会重定向到 `/admin` |

**相关环境变量**：`SESSION_SECRET`、`ERIKA_PASSWORD`、`LIN_PASSWORD`（仅 seed 用）

---

### 4.2 课程学习（Learn）

| 项目 | 实现 |
|------|------|
| 页面 | `/learn` 列表 + `/learn/[lessonId]` 详情 |
| 课程数据 | `Lesson` 表，`content` 字段存 JSON（介绍、例句、打字题、测验） |
| 交互 | `LessonPlayer` 客户端组件 — 分步：Intro → Words → Sentences → Typing → Quiz |
| 完成逻辑 | `completeLessonAction` — 写入进度、加入复习队列、奖励 XP、发邮件通知 |
| 词课关联 | `LessonWord` 多对多表 |

**扩展课程**：Admin 后台添加 shell 课，或编辑 `prisma/seed.ts` 后 `npm run db:seed`

---

### 4.3 间隔重复复习（Review）

| 项目 | 实现 |
|------|------|
| 算法 | `src/lib/srs.ts` — **SM-2** 间隔重复 |
| 数据 | `ReviewCard` 表（ease、interval、dueDate、markedHard） |
| 交互 | `ReviewSession` — 点击翻面，Again / Hard / Good / Easy 四档评分 |
| 完成 | `finishReviewSessionAction` — 奖励 XP + 记录学习日 |

学完新课会自动 `upsert` 复习卡片。

---

### 4.4 听力练习（Listening）

| 项目 | 实现 |
|------|------|
| 题目生成 | `src/lib/exercises.ts` — `buildListeningExercises()` 从词库动态组题 |
| 题型 | 听选义、听选拼音、听短句填空 |
| 发音 | `SpeakButton` — 浏览器 **Web Speech API**（`zh-CN` TTS） |
| 计分 | `completeListeningAction` — 根据正确率记录，奖励 XP |

**注意**：TTS 质量依赖 Erika 的设备与浏览器（Chrome / Edge 较好）。

---

### 4.5 跟读录音（Speaking）

| 项目 | 实现 |
|------|------|
| 短语来源 | 词库 + Lin 人物卡短语（`buildSpeakingPhrases`） |
| 标准音 | Web Speech API TTS |
| 录音 | **MediaRecorder API** — 浏览器采集 `audio/webm` |
| 对比 | 播放标准音与用户录音，展示时长（波形对比为轻量实现） |
| 完成 | `completeSpeakingAction` — 练习满 5 句可解锁 `lin_phrases` 徽章 |

---

### 4.6 打字练习（Typing）

| 项目 | 实现 |
|------|------|
| 输入 | 拼音 + **数字声调**（如 `ni3hao3`） |
| 校验 | 客户端比对 `pinyinNumber` 与标准拼音 |
| 完成 | `completeTypingAction` |

---

### 4.7 AI 陪练（Chat with Lin）

| 项目 | 实现 |
|------|------|
| 页面 | `/practice/ai` — `AiChat` 客户端组件 |
| API | `POST /api/chat` — 服务端代理 DeepSeek，Key 不暴露给浏览器 |
| 模型 | `deepseek-chat`，temperature 0.8，max_tokens 300 |
| 人设 | `LIN_SYSTEM_PROMPT`（`src/app/api/chat/route.ts`）— 含你的个人背景设定 |
| 激励 | 聊满 3 轮调用 `completeAiChatAction`，每天一次 XP（内存去重） |

**修改 AI 人设**：只改 `LIN_SYSTEM_PROMPT`，重新部署即可，无需动数据库。

**相关环境变量**：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`

---

### 4.8 人物卡（Lin）

| 项目 | 实现 |
|------|------|
| 数据 | `PersonCard` 表，`phrases` 为 JSON 数组 |
| 页面 | `/people` — 展示 Lin 常用语句 |
| 种子 | `prisma/seed.ts` 中 `person-lin` |

---

### 4.9 词库与许愿（Vocabulary）

| 项目 | 实现 |
|------|------|
| 难词标记 | `markWordHardAction` — 缩短 SRS 间隔，Admin 进度页可见 |
| 学习许愿 | `addWishAction` — 写入 `WishItem`，邮件 + 站内通知 Lin |
| 词库 | `Word` 表，支持 `isCustom` 自定义词、`tagalogShort` 辅助 |

---

### 4.10 作业系统（Homework）

| 学习者端 | 实现 |
|----------|------|
| 提交 | `HomeworkSubmitForm` — 文字 + **MediaRecorder 录音** |
| 上传 | `POST /api/upload-audio` → **Vercel Blob**（`@vercel/blob` put） |
| 回退 | 无 Blob 配置时存 `data:audio/webm;base64,...` 到数据库（仅开发用） |

| 管理员端 | 实现 |
|----------|------|
| 布置 | `createHomeworkAction` |
| 批改 | `reviewHomeworkAction` — 文字反馈，Erika 端可见 |
| 通知 | 提交时 `notifyLin` 发邮件到 `NOTIFY_EMAIL` |

**Blob 环境变量**：`BLOB_STORE_ID`（Vercel 自动注入）、可选 `BLOB_READ_WRITE_TOKEN`

---

### 4.11 文化礼仪（Culture）

| 项目 | 实现 |
|------|------|
| 内容 | `src/lib/culture.ts` — 静态文章数组（称呼、饭桌、见家长） |
| 页面 | `/culture` — 服务端渲染，无数据库依赖 |

**扩展**：在 `cultureArticles` 数组中追加文章对象即可。

---

### 4.12 游戏化（XP / 等级 / 打卡）

| 项目 | 实现 |
|------|------|
| 逻辑 | `src/lib/progress.ts` + `src/lib/constants.ts` |
| XP 来源 | 完课、复习、听力、跟读、AI 聊天、作业、每日打卡 |
| 等级 | `level = f(xp)`，每级需 `level × 100` XP |
| 打卡 | `recordStudyDay` — 柔性 streak（断一天重置连续天数，不清零等级） |
| 徽章 | `Achievement` 表 — first_lesson、streak_7、lin_phrases、hsk1_30 |

---

### 4.13 邮件通知

| 项目 | 实现 |
|------|------|
| 实现 | `src/lib/email.ts` — nodemailer + QQ SMTP |
| 触发 | 完课、交作业、许愿 |
| 收件 | `NOTIFY_EMAIL`（2810745803@qq.com） |

**相关环境变量**：`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`

---

### 4.14 PWA

| 项目 | 实现 |
|------|------|
| Manifest | `public/manifest.json` |
| Service Worker | `public/sw.js` — 预缓存首页、复习页 |
| 注册 | `PwaRegister` 组件于 `layout.tsx` |

---

### 4.15 管理后台（Admin）

| 路径 | 功能 |
|------|------|
| `/admin` | 仪表盘、通知、快捷入口 |
| `/admin/lessons` | 创建课程（shell 结构） |
| `/admin/vocabulary` | 添加词条 |
| `/admin/homework` | 布置作业、听录音、反馈 |
| `/admin/progress` | Erika 进度、难词、许愿池 |

---

## 五、数据库模型（Prisma）

核心表：

- `User` / `UserProgress` — 用户与进度
- `Word` / `Lesson` / `LessonWord` / `LessonProgress` — 词与课
- `ReviewCard` — SRS 复习卡
- `PersonCard` — 人物短语卡
- `WishItem` — 学习许愿
- `Homework` / `HomeworkSubmission` — 作业与提交
- `Notification` — 站内通知
- `Achievement` — 成就徽章

完整定义见 `prisma/schema.prisma`。

---

## 六、环境变量清单

| 变量 | 用途 | 敏感 |
|------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 连接串 | ✅ |
| `SESSION_SECRET` | JWT 签名密钥 | ✅ |
| `DEEPSEEK_API_KEY` | AI 聊天 | ✅ |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | |
| `SMTP_*` | 邮件发送 | ✅ |
| `NOTIFY_EMAIL` | 通知收件邮箱 | |
| `NEXT_PUBLIC_SITE_NAME` | 站点品牌名 | |
| `BLOB_STORE_ID` | Vercel Blob（自动） | |
| `ERIKA_PASSWORD` / `LIN_PASSWORD` | 仅 seed 初始化密码 | ✅ |

**切勿**将 `.env` 提交到 Git 或发到聊天里。

---

## 七、日常维护指南

### 7.1 每周维护（你提到的节奏）

1. 登录 `lin` 账号 → Admin 查看进度、许愿、难词
2. 根据许愿池添加新词 / 新课程
3. 布置作业，听 Erika 录音并给反馈
4. 检查 QQ 邮箱通知是否正常

### 7.2 修改 Erika / Lin 密码

1. 修改 `.env` 中 `ERIKA_PASSWORD` / `LIN_PASSWORD`
2. 对 Neon 执行：`npm run db:seed`（会更新密码哈希）
3. 无需重新部署（密码在数据库中）

### 7.3 添加新词

**方式 A（推荐）**：Admin → Vocabulary → 填写表单  
**方式 B**：编辑 `prisma/seed.ts` → `npm run db:seed`（适合批量）

### 7.4 添加新课程

Admin → Lessons 只能创建空壳课（content 为占位 JSON）。完整课程需：

- 编辑 `prisma/seed.ts` 中的 `lessonXContent` 和 `lessons` 数组，或
- 未来可开发 Admin 课程编辑器

### 7.5 修改 AI 人设

编辑 `src/app/api/chat/route.ts` 中的 `LIN_SYSTEM_PROMPT` → 重新部署。

### 7.6 更新线上网站

```powershell
cd C:\Users\sus\ErikasChineseLearning
$env:VERCEL_TOKEN="你的token"
npx vercel --prod --token $env:VERCEL_TOKEN
```

若改了 `prisma/schema.prisma`，本地先 `npx prisma db push` 同步 Neon，再部署。

### 7.7 国内访问注意

`*.vercel.app` 在国内可能无法直连，你维护时需 **VPN**。Erika 在菲律宾一般可正常访问。长期可考虑绑定自定义域名。

---

## 八、维护注意事项

### 安全

- 定期轮换 Vercel Token、DeepSeek Key、数据库密码、SMTP 授权码
- 不要在公开场合分享 `.env`、Token、数据库连接串
- `SESSION_SECRET` 生产环境使用长随机字符串

### 数据库

- **不要**在生产环境随意 `db:seed`（会更新用户密码哈希，但不会删 Erika 的学习进度）
- 结构性变更用 `prisma db push` 或迁移
- 重要操作前可在 Neon 控制台做分支备份

### 部署

- 避免在 `npm run dev` 运行时执行 `npm run build`（会损坏 `.next` 缓存）
- 改环境变量后必须 **Redeploy** 才生效
- Vercel CLI 在中文 Windows 用户名环境下 `vercel login` 可能失败，用 **Token 方式**部署

### 录音存储

- 生产环境已启用 Vercel Blob，录音不占用数据库大块空间
- Blob 用量可在 Vercel Storage 面板查看

### AI 聊天

- `completeAiChatAction` 的「每日一次 XP」用进程内 `Set` 去重，Serverless 冷启动可能重复发放（影响极小，可接受）

---

## 九、功能扩展指南

### 9.1 低工作量扩展

| 需求 | 做法 |
|------|------|
| 加 Lin 专属短语 | Admin 加词，或改 `seed.ts` 中 `linPhrases` |
| 加文化文章 | 编辑 `src/lib/culture.ts` |
| 调 AI 语气 / 背景 | 改 `LIN_SYSTEM_PROMPT` |
| 加家人人物卡 | `PersonCard` 表 + seed + `/people` 页扩展 |
| 新 HSK 词 | Admin Vocabulary 或 seed |

### 9.2 中等工作量

| 需求 | 建议做法 |
|------|----------|
| Admin 可视化课程编辑 | 新建 `/admin/lessons/[id]/edit`，JSON 表单编辑 `Lesson.content` |
| 真人录音替代 TTS | 上传 MP3 到 Blob，在 `Word.audioUrl` 引用 |
| 自定义域名 | Vercel Domains + DNS（Cloudflare） |
| 改密后台 | 新增 `/admin/settings` + bcrypt 更新 |
| Tagalog UI 校对 | 改 `src/components/layout.tsx` 导航与关键文案 |

### 9.3 较大扩展

| 需求 | 建议做法 |
|------|----------|
| HSK 全等级自动导入 | 脚本解析开源 HSK 词表 CSV → 批量 `prisma.word.create` |
| 语音识别评分 | 接入 Azure Speech / OpenAI Whisper API |
| 多学习者 | 重构为正式注册系统，放弃双账号硬编码 |
| 国内无障碍访问 | 国内 CDN + 备案域名，或 Cloudflare 代理 |
| 视频课 | 嵌入 Bilibili / YouTube 链接字段到 `Lesson.content` |

### 9.4 推荐扩展顺序

1. 家人人物卡（爸爸、妈妈）  
2. Admin 课程 JSON 编辑器  
3. 真人录音素材库  
4. 自定义域名  
5. HSK2 词表批量导入  

---

## 十、常用命令速查

```powershell
# 本地开发
npm run dev

# 同步数据库结构到 Neon
$env:DATABASE_URL="postgresql://..."
npx prisma db push

# 写入/更新种子数据
npm run db:seed

# 本地构建验证
npm run build

# 部署生产
npx vercel --prod --token $env:VERCEL_TOKEN

# 测试邮件
npx tsx scripts/test-email.ts
```

---

## 十一、相关文档

- `README.md` — 项目简介与快速启动  
- `DEPLOY.md` — 公网部署完整流程  
- `BLOB_SETUP.md` — 作业录音 Blob 配置  

---

*文档版本：2026-07-11 · 对应线上已部署版本（含 Blob 录音）*
