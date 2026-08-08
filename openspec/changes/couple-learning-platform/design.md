## Context

See `proposal.md` for motivation. Today the app is a Next.js + Prisma + Neon monolith with hard-coded `lin`/`erika`, Mandarin-centric `Word`/`hskLevel`, couple persona prompts in `@erika/ai-core`, and `/admin/*` as tutor tools—not a platform ops console. Constraints: self-operated couple product, moral 1:1, privacy (ops cannot read COUPLE bodies), Vercel user site, optional Go worker plane for distributed-systems practice.

## Goals / Non-Goals

**Goals:**
- Introduce Couple / Subject / Course / Enrollment / LearningItem / scoped KnowledgeChunk without losing the existing Erika×Lin deployment as the first migrated couple + chinese course.
- Split PLATFORM_ADMIN (local ops) from TUTOR/LEARNER (public user site).
- Ship tutor text import → COUPLE RAG with UTF-8 gate, chunker.v1, history edit/rollback.
- Define a Go + Redis Streams worker plane (with PG queue driver as pluggable fallback) and Mock Embed load-test matrix.

**Non-Goals:**
- Public SaaS billing, multi-learner classes, or marketplace browsing of all templates.
- Model weight fine-tuning; v1 “training” is private corpus ingest only.
- Kafka, etcd leader election, C++ data plane, or MCP as production ingest path.
- Implementing a second full subject pack beyond generic LearningItem smoke.

## Decisions

### D1 — Identity and couple tenancy
- **Choice:** `User.email` unique + `platformRole` (`MEMBER` | `PLATFORM_ADMIN`); `Couple` + `CoupleMembership` with `UNIQUE(userId)`, `UNIQUE(coupleId, role)` for TUTOR|LEARNER; couple `PENDING_VERIFY` until both emails verified, then `ACTIVE`.
- **Alternatives:** Keep username login — rejected (email binding required). Soft verify — rejected (strict dual verify).

### D2 — Progress split
- **Choice:** Global `UserProgress` for XP/streak; per-enrollment progress for subject level labels (replaces single global `hskLevel` as sole level).
- **Why:** Parallel courses would collide on one `hskLevel`.

### D3 — Content model
- **Choice:** `LearningItem` + optional `ChineseWordExtension`; migrate `Word` → chinese items; SRS `ReviewCard` → `learningItemId`; v1 global card per `(userId, learningItemId)`.
- **Alternatives:** Keep Word-only — rejected (blocks subject B).

### D4 — Knowledge scope
- **Choice:** `KnowledgeChunk.subjectId`, `scope` SHARED|COUPLE, `coupleId` null iff SHARED; retrieve `SHARED(subject) ∪ COUPLE(couple, subject)`.
- **Privacy:** Ops APIs omit content columns; metrics/logs never print bodies.

### D5 — Templates cite vs fork
- **Choice:** Owner-only edit; public-ish access by knowing `templateId`; cite pins `(templateId, version)`; any edit by non-owner requires fork to new `templateId` owned by citer; never write-back.
- **Alternatives:** Live follow — rejected (owner edits would surprise citers / risk coupling). Copy-on-cite always — optional later; pin+explicit fork is enough.

### D6 — Import encoding and chunker
- **Choice:** Strict UTF-8 (`fatal`), strip BOM, reject UTF-16; `chunker.v1` plaintext target 700 / max 1000 / min 80 / overlap 80; presets fine/standard/article; limits ~2MB / ~150k chars / ~400 chunks.
- **Why:** One user-facing encoding rule; aligns chunk size with Top-K prompt budget.

### D7 — Import UX semantics
- **Choice:** Import history is first-class; edit = full replace revision; cancel/rollback = delete all artifacts for that `importId`.
- **Staging:** `ImportChunk` holds text for processing; retain body while history edit is possible (product default: keep until rollback/purge policy, metadata permanent).

### D8 — Product path vs worker plane
- **Choice:** User site enqueues after confirm (DB + Outbox). **Product bootstrap:** TS/Cron or `waitUntil` consumer acceptable. **Practice/prod scale path:** Go workers, Redis Streams consumer group, couple Redis lock, embed batch 32, no hash fallback, Mock embedder for matrix `W × {0,50,200}ms` with fixture 200×96 chunks.
- **Alternatives:** MCP/C++ ingest — rejected for production path. Kafka — overkill.

### D9 — Deployment split
- **Choice:** Public Next user app on Vercel; Ops as local-only app/entrypoint (`PLATFORM_ADMIN`, bind localhost); workers on Docker Compose / small VPS, not Serverless long jobs.
- **DB:** Single Neon; vector column remains SQL-managed (avoid destructive `db push`).

### D10 — Feature migration map
| Legacy | Target |
|--------|--------|
| Erika learner UX | LEARNER role routes |
| Lin `/admin/*` | TUTOR routes (not ops) |
| New local ops | PLATFORM_ADMIN only |
| Seed pair | First ACTIVE couple after migration + verified emails in seed/dev |

## Risks / Trade-offs

- **[Risk] Large Prisma migration breaks production data** → Mitigation: expand/contract migrations; map Word→LearningItem in place; keep dual-read adapters briefly; manual SQL for pgvector.
- **[Risk] Strict dual verify hurts activation** → Accepted for moral/product; provide resend + clear PENDING UX.
- **[Risk] Redis adds ops burden** → Pluggable PG `SKIP LOCKED` driver; Redis default for practice plane.
- **[Risk] Fork/cite complexity confuses tutors** → UI copy: “引用（只读钉版本）” vs “复制为我的模板后编辑”.
- **[Risk] Import cost / abuse** → Per-import chunk caps, per-couple serial, global rate limit on workers.
- **[Trade-off] Generic second subject is thin** → Enough to prove B; full English pack later.

## Migration Plan

1. Add new tables/columns nullable; backfill Subject `chinese`, default Course from existing lessons, Couple from lin+erika, Word→LearningItem+ChineseExt, chunks → SHARED chinese.
2. Switch auth to email; issue verification in prod carefully (dev may auto-verify seed).
3. Move tutor UI off `/admin` naming; gate PLATFORM_ADMIN ops separately.
4. Enable import pipeline behind tutor flag; run worker locally/Compose before any public stress.
5. Rollback: feature flags to freeze new registration; old username path only if dual-stack kept—prefer forward fix with DB backup restore for hard fail.

## Open Questions

- Exact email provider templates and localized copy (non-blocking for schema).
- Whether shared official templates are owned by a system user vs PLATFORM_ADMIN identity (implementation detail; behavior unchanged).
