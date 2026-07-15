-- 手动迁移：新增 LessonAttempt 表（记录每次课程答题详情）
-- 不用 prisma db push 是因为它会误删 pgvector 手动添加的 embedding_vec 列
CREATE TABLE IF NOT EXISTS "LessonAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LessonAttempt_userId_lessonId_idx" ON "LessonAttempt"("userId", "lessonId");
CREATE INDEX IF NOT EXISTS "LessonAttempt_completedAt_idx" ON "LessonAttempt"("completedAt");

ALTER TABLE "LessonAttempt" DROP CONSTRAINT IF EXISTS "LessonAttempt_userId_fkey";
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonAttempt" DROP CONSTRAINT IF EXISTS "LessonAttempt_lessonId_fkey";
ALTER TABLE "LessonAttempt" ADD CONSTRAINT "LessonAttempt_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
