# Erika's Chinese Learning

Private Chinese learning site for Erika — **Jaylin_love_Erika**

A warm, couple-themed web app to help Erika learn Simplified Mandarin (HSK-based), with personalized content from Lin, spaced repetition, homework, and email notifications.

## Features (P0–P9+)

- **Learner app** (Erika): daily main-task home, bottom nav, HSK lessons (instant quiz feedback + mistakes book), SRS review (offline sync), practice hub (dictation, writing check, smart quiz, roleplay, handwriting, listen/speak/type), AI chat, homework (voice), vocabulary & wishes, profile vocab charts
- **Admin app** (Lin): dashboard, lesson visual editor, vocabulary, homework with voice messages, progress (attempts, writing corrections, daily/weekly report buttons)
- **Auth**: simple password login (`erika` / `lin`)
- **Email** (to `NOTIFY_EMAIL`):
  - **Daily digest** 23:00 Beijing time (lessons, mistakes, reviews, writing, homework…)
  - **Weekly report** Sunday night 24:00 / Monday 00:00 Beijing
  - **Immediate** only for new learning **wishes**
  - No immediate email on lesson complete or homework submit
- **AI**: DeepSeek + RAG + SSE; see [docs/AI_ARCHITECTURE.zh-CN.md](./docs/AI_ARCHITECTURE.zh-CN.md)
- **PWA**: offline-friendly review via service worker

## Quick start

```bash
cd ErikasChineseLearning
cp .env.example .env
# Edit .env: SESSION_SECRET, passwords, DEEPSEEK_API_KEY, SMTP settings

npm install
npm run db:push
npm run db:seed
npm run hsk:download
npm run hsk:import
npm run ai:index
npm run pgvector:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default accounts (after seed)

| User  | Username | Default password |
|-------|----------|------------------|
| Erika | `erika`  | `erika2024`      |
| Lin   | `lin`    | `lin2024`        |

Change passwords in `.env` before seeding, or update hashes in the database.

## Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `SESSION_SECRET` | JWT session secret (32+ chars in production) |
| `ERIKA_PASSWORD` / `LIN_PASSWORD` | Initial passwords for seed |
| `DEEPSEEK_API_KEY` | For AI chat (Phase P4) |
| `OPENAI_API_KEY` | For RAG embeddings (optional — hash fallback in dev) |
| `RAG_TOP_K` / `RAG_RERANK_TOP_K` | Retrieval tuning (defaults: 8 / 4) |
| `SMTP_*` | QQ mail SMTP for notifications |
| `NOTIFY_EMAIL` | Lin's notification email |
| `CRON_SECRET` | Optional; protects `/api/cron/*` (Vercel Cron) |
| `NEXT_PUBLIC_SITE_NAME` | `Jaylin_love_Erika` |

### QQ Mail SMTP setup

1. Enable SMTP in QQ Mail settings
2. Generate an authorization code (not your QQ password)
3. Set `SMTP_USER` to your QQ email and `SMTP_PASS` to the authorization code

## Project structure

```
src/
  app/           # Next.js App Router pages
  components/    # UI components
  lib/           # db, auth, SRS, email, progress
prisma/
  schema.prisma  # Database models
  seed.ts        # HSK1 seed + 2 starter lessons + Lin card
```

## Roadmap

- **P0** ✅ Core learning loop, admin, notifications
- **P1** ✅ Listening quiz, speaking (follow-along + recording)
- **P2** ✅ Typing practice with pinyin number tones
- **P3** More couple/family scene lessons
- **P4** ✅ DeepSeek AI chat as Lin
- **P5** Audio homework uploads
- **P6** Culture module, full PWA offline, Tagalog UI polish
- **P7** ✅ RAG knowledge base + SSE streaming chat
- **P8** 🚧 Multi-agent routing (vocabulary/grammar/practice/report)
- **P9** Multi-modal input (STT + TTS)

### AI Service commands

```bash
npm run hsk:download    # Download HSK 2.0 wordlists + HSK 3.0 grammar
npm run hsk:import      # Import ~5000 words + 624 grammar points
npm run ai:index        # Index words, lessons, examples into knowledge base
npm run pgvector:setup  # Enable pgvector HNSW index on Neon
npm run ai:index:incremental  # Only changed content (~seconds)
npm run ai:bench        # Run latency & concurrency benchmarks
npm run ai:report       # Regenerate docs/AI_PERFORMANCE.md
npm run ai-service:dev  # Standalone AI microservice (optional)
```

## Deploy (Vercel + Neon PostgreSQL)

**Full guide (中文)**: see [DEPLOY.md](./DEPLOY.md)

Quick checklist:

1. Create free DB at [neon.tech](https://neon.tech) → copy pooled `DATABASE_URL`
2. Run `DATABASE_URL=... npx prisma db push && npm run db:seed` once
3. Deploy at [vercel.com](https://vercel.com) → import project → add all env vars from `.env.example`
4. Share the `*.vercel.app` URL with Erika in the Philippines

Region: `hkg1` (Hong Kong) is set in `vercel.json` for CN ↔ PH latency.

## Documentation (中文)

| 文档 | 说明 |
|------|------|
| [docs/LIN_MAINTAINER_GUIDE.zh-CN.md](./docs/LIN_MAINTAINER_GUIDE.zh-CN.md) | 维护者技术手册（Lin） |
| [docs/ERIKA_USER_GUIDE.en.md](./docs/ERIKA_USER_GUIDE.en.md) | Erika 使用指南（英文） |
| [docs/AI_ARCHITECTURE.zh-CN.md](./docs/AI_ARCHITECTURE.zh-CN.md) | AI 架构（RAG + Agent + SSE） |
| [docs/AI_MICROSERVICE.zh-CN.md](./docs/AI_MICROSERVICE.zh-CN.md) | AI 微服务模式 |
| [docs/AI_PERFORMANCE.md](./docs/AI_PERFORMANCE.md) | 性能测试报告 |
| [docs/AI_BLOG.zh-CN.md](./docs/AI_BLOG.zh-CN.md) | 技术博客草稿 |
| [DEPLOY.md](./DEPLOY.md) | 公网部署指南 |
| [BLOB_SETUP.md](./BLOB_SETUP.md) | Vercel Blob 录音存储 |

## Upload to GitHub

**Before pushing**, confirm sensitive files are not tracked:

```powershell
git check-ignore -v .env .env.local    # should show .gitignore rules
git status                               # .env must NOT appear
```

Recommended: **private repository** (contains couple learning app config).

```powershell
# 1. Install GitHub CLI (if needed): winget install GitHub.cli
# 2. Log in (browser flow)
gh auth login

# 3. First commit + create private repo and push
git add .
git commit -m "Initial commit: Erika Chinese learning app"
gh repo create ErikasChineseLearning --private --source=. --remote=origin --push
```

After GitHub is connected, Vercel can **Import Git Repository** for auto-deploy on `git push` (see [DEPLOY.md](./DEPLOY.md)).

## License

Private project — Jaylin_love_Erika
