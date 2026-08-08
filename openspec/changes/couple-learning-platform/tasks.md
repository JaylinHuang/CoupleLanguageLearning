## 1. Schema and migration foundation

- [x] 1.1 Add Prisma models: Couple, CoupleMembership, Subject, Course, Enrollment, LearningItem, ChineseWordExtension, template versioning fields, KnowledgeChunk scope/subject/coupleId, Import/ImportChunk/Outbox stubs
- [x] 1.2 Write expand-safe SQL migration (preserve pgvector); avoid destructive db push
- [x] 1.3 Backfill Subject `chinese`, default shared Course from existing Lessons, Couple from lin+erika users, Word→LearningItem+ChineseExt, chunks→SHARED
- [x] 1.4 Migrate ReviewCard FKs to learningItemId; dual-read adapter if needed during cutover
- [x] 1.5 Add PLATFORM_ADMIN seed user separate from couple membership; email fields on User

## 2. Couple identity and auth

- [x] 2.1 Implement paired registration transaction (two users, roles, PENDING_VERIFY couple)
- [x] 2.2 Enforce email uniqueness and membership uniqueness constraints in app layer + DB
- [x] 2.3 Email verification flow for both members; gate features until ACTIVE
- [x] 2.4 Replace username hard-coding (`erika`/`lin`) in cron, admin, reports with couple/learner resolution
- [x] 2.5 Update middleware/session to carry platformRole + couple membership

## 3. Courses, templates, enrollment

- [ ] 3.1 Course CRUD: SHARED_TEMPLATE vs COUPLE_PRIVATE; enroll parallel courses
- [ ] 3.2 Template ID + version publish on owner edit; owner-only update authorization
- [ ] 3.3 Cite-by-ID with pinned version; explicit upgrade action
- [ ] 3.4 Fork-to-own-template flow; forbid write-back to source template
- [ ] 3.5 Couple-private lesson authoring under private courses

## 4. Learning content and SRS

- [ ] 4.1 LearningItem APIs for chinese_word and generic types
- [ ] 4.2 Point lesson word links and vocabulary UI at LearningItem
- [ ] 4.3 SRS review path uses global (userId, learningItemId)
- [ ] 4.4 Split global XP/streak vs per-enrollment level progress

## 5. Knowledge scope and AI context

- [ ] 5.1 Update retriever filters for SHARED ∪ COUPLE(subject, coupleId)
- [ ] 5.2 Scope chat/session metadata with coupleId + subjectId
- [ ] 5.3 Compose prompts from couple persona + subject base; remove hard-coded single-user assumptions where required
- [ ] 5.4 Ensure Ops/query helpers never select COUPLE content bodies

## 6. Tutor corpus import (product path)

- [ ] 6.1 Upload + strict UTF-8 validation and reject UX
- [ ] 6.2 chunker.v1 dry-run preview with limits and presets
- [ ] 6.3 Confirm → Import + ImportChunk + Outbox/queue; progress API
- [ ] 6.4 TS bootstrap consumer (Cron/waitUntil) embed batch 32 without hash fallback
- [ ] 6.5 Import history UI: list, rollback (full), edit/replace revision
- [ ] 6.6 Cancel in-flight = full rollback

## 7. Role UX split (user site)

- [ ] 7.1 Learner routes retain Erika-equivalent capabilities under LEARNER
- [ ] 7.2 Move former `/admin` tutor tools to TUTOR-only routes/nav
- [x] 7.3 Registration/login/branding copy for multi-couple platform (keep migratable default couple theme)

## 8. Local ops console

- [x] 8.1 Add local-only ops entry (separate app or guarded localhost server)
- [x] 8.2 PLATFORM_ADMIN auth; block on non-local bind in production configs
- [ ] 8.3 Shared HSK / official template governance screens
- [x] 8.4 Couple support metadata views without private bodies

## 9. Go import worker plane (practice / scale path)

- [x] 9.1 Scaffold Go module: Embedder interface (OpenAI + Mock), batch size 32
- [ ] 9.2 Redis Streams consumer group + XAUTOCLAIM; Outbox relay from Postgres
- [ ] 9.3 Per-couple lock, lease heartbeat, idempotent upsert by importId+idx
- [ ] 9.4 Docker Compose with worker×2 + redis; wire env to Neon
- [ ] 9.5 Load-test fixture + CSV metrics for W×mock delay matrix; assert zero duplicate chunks
- [ ] 9.6 Optional PG SKIP LOCKED driver behind same queue interface

## 10. Docs and validation

- [ ] 10.1 Update maintainer and user docs for registration, privacy, templates, import
- [ ] 10.2 Document ops local runbook and worker Compose runbook
- [ ] 10.3 End-to-end smoke: register couple → verify → enroll → import UTF-8 → chat hits COUPLE chunk → rollback
- [ ] 10.4 `openspec validate` / review checklist against capability scenarios
