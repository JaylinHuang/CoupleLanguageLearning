# 公网部署指南 — CoupleLanguageLearning

让双方都能远程访问同一套学习站点。

**推荐方案**：Vercel（网站）+ Neon（PostgreSQL 数据库）  
**预计时间**：约 15 分钟  
**费用**：免费档够用（私人站点）

---

## 第一步：创建 Neon 数据库（PostgreSQL）

1. 打开 [https://neon.tech](https://neon.tech) 注册账号  
2. **New Project** → 名称随意（如 `jaylin-erika`）  
3. Region 选 **Asia Pacific (Singapore)** 或离你近的  
4. 创建后复制 **Connection string**（选 **Pooled connection**，带 `?sslmode=require`）  
   形如：
   ```
   postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

## 第二步：初始化线上数据库

在你电脑上（项目目录），**临时**把 Neon 连接串用于推送表结构和种子数据：

```powershell
cd C:\Users\sus\ErikasChineseLearning

# 把下面换成你的 Neon 连接串
$env:DATABASE_URL="postgresql://..."
$env:ERIKA_PASSWORD="your-erika-password"
$env:LIN_PASSWORD="your-lin-password"

npx prisma db push
npm run db:seed
```

看到 `Seed complete.` 即表示 Erika / Lin 账号已写入线上库。

---

## 第三步：部署到 Vercel

### 方式 A — 网页部署（推荐）

1. 打开 [https://vercel.com](https://vercel.com) 用 GitHub 或邮箱登录  
2. **Add New → Project**  
3. 若项目在 GitHub：选仓库导入；若还没有，可先 **Import Git Repository** 或本地用 CLI（方式 B）  
4. **Environment Variables** 添加下表全部变量（Production）：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | Neon 连接串（Pooled） |
| `SESSION_SECRET` | 一长串随机字符（与本地 `.env` 相同即可） |
| `ERIKA_PASSWORD` | 你在 `.env` 里设的 Erika 密码（仅 seed 用，部署后可删） |
| `LIN_PASSWORD` | 你在 `.env` 里设的 Lin 密码 |
| `DEEPSEEK_API_KEY` | 你的 Key |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| `SMTP_HOST` | `smtp.qq.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | 你的 QQ 邮箱 |
| `SMTP_PASS` | QQ SMTP 授权码 |
| `NOTIFY_EMAIL` | 接收通知的邮箱 |
| `NEXT_PUBLIC_SITE_NAME` | `CoupleLanguageLearning` |

5. 点击 **Deploy**，等待构建完成  
6. 得到公网地址，例如：`https://jaylin-love-erika.vercel.app`

### 方式 B — 命令行部署

```powershell
cd C:\Users\sus\ErikasChineseLearning
npx vercel login
npx vercel link
npx vercel env pull   # 或在网页配好环境变量
npx vercel --prod
```

---

## 第四步：验证

1. 浏览器打开 Vercel 给的 URL  
2. Erika 登录：`erika` / 你在 seed 时设的密码  
3. 你登录：`lin` / 你在 seed 时设的密码  
4. 让 Erika 完成一节课 — **不会立刻发完课邮件**；可在 Admin → Progress 点「Send daily report now」测日报  
5. 测试 **Chat with Lin AI**（`/practice/ai`）— 应看到流式打字、RAG 命中  
6. （可选）在 Words 页提交一条 wish — 应立刻收到许愿邮件  

### 邮件与 Cron（上线后）

| 任务 | 北京时间 | 路径 |
|------|----------|------|
| 学习日报 | 每天 23:00 | `/api/cron/daily-report` |
| 学习周报 | 周日晚 24:00（周一 0:00） | `/api/cron/weekly-report` |

建议在 Vercel 环境变量配置 `CRON_SECRET`。重新部署后 Cron 才会按 `vercel.json` 生效。

---

## 第五步（一次性）：线上 AI 知识库

若 Erika 问词汇时 AI 回答不够精准，在你电脑上对 **Neon 线上库** 跑一遍（与本地 `.env` 同一 `DATABASE_URL` 即可）：

```powershell
cd C:\Users\sus\ErikasChineseLearning

npm run hsk:download
npm run hsk:import      # ~5000 词 + 语法点
npm run ai:index        # 首次约 12 分钟
npm run pgvector:setup  # 向量检索加速
```

**若你本地 `.env` 已连 Neon 且跑过上述命令，可跳过** — 数据库是共用的，部署代码后 Erika 直接用。

Vercel 环境变量建议补充：

| 变量名 | 说明 |
|--------|------|
| `OPENAI_API_KEY` | RAG 嵌入（推荐；无则降级为 hash） |
| `PGVECTOR_ENABLED` | `true`（若已跑 `pgvector:setup`） |

**不需要**在 Vercel 上配置 `AI_SERVICE_URL` — 线上默认 AI 内嵌在 Next.js 里，无需单独微服务。

---

## 自定义域名（可选）

在 Vercel 项目 → **Settings → Domains** 添加你自己的域名，按提示配置 DNS。

---

## 本地开发（部署后）

线上已改用 **PostgreSQL**，本地 `.env` 的 `DATABASE_URL` 也要改成 Neon 连接串（可与线上同一库，或 Neon 再建一个 dev 分支）。

```env
DATABASE_URL="postgresql://...neon...?sslmode=require"
```

然后：

```powershell
npm run dev
```

---

## 以后更新网站

```powershell
git add .
git commit -m "update"
git push
# 若已连 Vercel + GitHub，会自动重新部署
```

---

## 上传到 GitHub（首次）

1. 确认 `.env` 不会被提交：`git check-ignore -v .env` 应显示 `.gitignore` 规则  
2. 安装并登录 GitHub CLI：`winget install GitHub.cli`，然后 `gh auth login`  
3. 在项目目录执行：

```powershell
git add .
git commit -m "Initial commit: Erika Chinese learning app"
gh repo create ErikasChineseLearning --private --source=. --remote=origin --push
```

建议选 **Private** 仓库。推送完成后，见下方「关联已有 Vercel 项目」。

---

## 关联已有 Vercel 项目与 GitHub（推荐）

若你之前用 CLI / 网页手动部署过（例如 `jaylin-love-erika.vercel.app`），**不要新建项目**，在现有项目里关联仓库即可；**环境变量会保留**。

### 第 1 步：让 Vercel 能访问 GitHub 仓库

1. 打开 [github.com/settings/installations](https://github.com/settings/installations)  
2. 找到 **Vercel**，点 **Configure**  
3. **Repository access** → 选 **Only select repositories**  
4. 添加 **`JaylinHuang/ErikasChineseLearning`** → **Save**

### 第 2 步：在 Vercel 项目里连接 Git

1. 打开 [vercel.com/dashboard](https://vercel.com/dashboard)  
2. 进入已有项目（如 **jaylin-love-erika**）  
3. **Settings** → 左侧 **Git**  
4. **Connect Git Repository** → 选 **GitHub** → **`JaylinHuang/ErikasChineseLearning`**

### 第 3 步：确认生产分支

本仓库默认分支是 **`master`**（不是 `main`）：

1. 仍在 **Settings → Git**  
2. **Production Branch** 设为 **`master`**  
3. 保存

### 第 4 步：触发首次 Git 部署

关联成功后 Vercel 通常会立即部署一次。若没有：

```powershell
git commit --allow-empty -m "trigger vercel git deploy"
git push
```

在 **Deployments** 页应看到来源为 **Git** 的新部署；成功后以后每次 `git push` 都会自动重新部署。

### 常见问题

| 现象 | 处理 |
|------|------|
| 列表里找不到仓库 | 回到第 1 步，确认 Vercel GitHub App 已授权该仓库 |
| 部署失败 Build Error | 检查 Vercel 环境变量是否齐全（见 `.env.example`） |
| push 了但不部署 | 确认 Production Branch 是 `master`，且 push 的是 `master` 分支 |
| `vercel login` 在中文 Windows 用户名失败 | 用网页关联即可；CLI 部署可用 `deploy-token.ps1` |

或（不关联 Git，手动部署）：

```powershell
npx vercel --prod
```

---

## 以后补充 AI 设定

编辑 `packages/ai-core/src/config.ts` 里的 `LIN_SYSTEM_PROMPT`，保存后重新部署即可，**不用改数据库**。

Lin 改词/课后可选增量索引（秒级）：

```powershell
npm run ai:index:incremental
```

---

## 注意事项

- **录音作业上传**在 Vercel 上暂不能持久存本地磁盘，文字作业正常；后续可接 Vercel Blob。  
- **SESSION_SECRET** 生产环境务必用长随机串。  
- 部署成功后建议改 Erika/Lin 密码（在 `.env` 改完后对 Neon 再跑一次 `db:seed`，或以后做改密码后台）。
