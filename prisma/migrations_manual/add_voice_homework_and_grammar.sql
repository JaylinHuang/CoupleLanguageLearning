-- 手动迁移：语音留言作业 + AI 语法纠错记录
-- 不用 prisma db push 是因为它会误删 pgvector 手动添加的 embedding_vec 列

-- Homework 增加 Lin 的语音留言字段
ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "audioPath" TEXT;

-- AI 语法纠错练习记录表
CREATE TABLE IF NOT EXISTS "GrammarCorrection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarCorrection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "GrammarCorrection_userId_createdAt_idx" ON "GrammarCorrection"("userId", "createdAt");

ALTER TABLE "GrammarCorrection" DROP CONSTRAINT IF EXISTS "GrammarCorrection_userId_fkey";
ALTER TABLE "GrammarCorrection" ADD CONSTRAINT "GrammarCorrection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
