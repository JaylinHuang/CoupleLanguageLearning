# AI Microservice

Standalone HTTP service for RAG + Agent + SSE chat. Shares PostgreSQL with the main Next.js app via `@erika/ai-core`.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/v1/chat/stream` | Bearer + X-User-* | SSE streaming chat |
| POST | `/v1/chat` | Bearer + X-User-* | JSON chat |
| POST | `/v1/rag/search` | Bearer + X-User-* | RAG retrieval |
| GET | `/v1/knowledge/stats` | Bearer + Admin | Knowledge stats |
| POST | `/v1/knowledge/index` | Bearer + Admin | Incremental index |

## Quick start

```bash
# From repo root
cp services/ai-service/.env.example services/ai-service/.env
# Edit .env — same DATABASE_URL and API keys as main app

npm install
npm run ai-service:dev
```

Service runs at `http://localhost:3001`.

## Connect Next.js

In root `.env`:

```env
AI_SERVICE_URL=http://localhost:3001
AI_SERVICE_API_KEY=change-me-to-a-long-random-key
```

When `AI_SERVICE_URL` is set, Next.js API routes proxy to this service. When unset, AI runs in-process (default for local dev).

## Deploy

Deploy as a separate container/VM (Railway, Fly.io, ECS). Requirements:

- Node.js 20+
- Access to same `DATABASE_URL` as main app
- `AI_SERVICE_API_KEY` shared with Next.js

```bash
npm run ai-service:start
```

## Architecture

```
Next.js (auth) ──proxy──▶ AI Service (Express)
                              │
                              ▼
                         @erika/ai-core
                              │
                              ▼
                    PostgreSQL + pgvector
```
