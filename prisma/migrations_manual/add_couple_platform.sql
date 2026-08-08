-- 情侣学习平台：扩展表结构（保留 embedding_vec / HNSW，勿用 prisma db push）
-- 在 Neon SQL Editor 或 psql 中执行

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformRole" TEXT NOT NULL DEFAULT 'MEMBER';
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Subject / Couple / Membership
CREATE TABLE IF NOT EXISTS "Subject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "practiceModules" TEXT NOT NULL DEFAULT '[]',
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Couple" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFY',
  "personaPrompt" TEXT,
  "learnerNickname" TEXT,
  "tutorNickname" TEXT,
  "siteTitle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Couple_slug_key" ON "Couple"("slug");

CREATE TABLE IF NOT EXISTS "CoupleMembership" (
  "id" TEXT NOT NULL,
  "coupleId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CoupleMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CoupleMembership_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CoupleMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "CoupleMembership_userId_key" ON "CoupleMembership"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CoupleMembership_coupleId_role_key" ON "CoupleMembership"("coupleId", "role");
CREATE INDEX IF NOT EXISTS "CoupleMembership_coupleId_idx" ON "CoupleMembership"("coupleId");

CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'SHARED_TEMPLATE',
  "ownerCoupleId" TEXT,
  "ownerUserId" TEXT,
  "templateId" TEXT,
  "templateVersion" INTEGER NOT NULL DEFAULT 1,
  "forkedFromTemplateId" TEXT,
  "forkedFromVersion" INTEGER,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Course_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Course_ownerCoupleId_fkey" FOREIGN KEY ("ownerCoupleId") REFERENCES "Couple"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Course_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Course_templateId_key" ON "Course"("templateId");
CREATE INDEX IF NOT EXISTS "Course_subjectId_idx" ON "Course"("subjectId");
CREATE INDEX IF NOT EXISTS "Course_ownerCoupleId_idx" ON "Course"("ownerCoupleId");
CREATE INDEX IF NOT EXISTS "Course_visibility_idx" ON "Course"("visibility");

CREATE TABLE IF NOT EXISTS "Enrollment" (
  "id" TEXT NOT NULL,
  "coupleId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "levelLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Enrollment_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_coupleId_courseId_key" ON "Enrollment"("coupleId", "courseId");
CREATE INDEX IF NOT EXISTS "Enrollment_coupleId_idx" ON "Enrollment"("coupleId");

CREATE TABLE IF NOT EXISTS "LearningItem" (
  "id" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "meaningPrimary" TEXT NOT NULL,
  "meaningSecondary" TEXT,
  "tags" TEXT NOT NULL DEFAULT '[]',
  "audioUrl" TEXT,
  "notes" TEXT,
  "scope" TEXT NOT NULL DEFAULT 'SHARED',
  "ownerCoupleId" TEXT,
  "sourceRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LearningItem_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "LearningItem_ownerCoupleId_fkey" FOREIGN KEY ("ownerCoupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "LearningItem_subjectId_scope_idx" ON "LearningItem"("subjectId", "scope");
CREATE INDEX IF NOT EXISTS "LearningItem_ownerCoupleId_idx" ON "LearningItem"("ownerCoupleId");
CREATE INDEX IF NOT EXISTS "LearningItem_sourceRef_idx" ON "LearningItem"("sourceRef");

CREATE TABLE IF NOT EXISTS "ChineseWordExtension" (
  "learningItemId" TEXT NOT NULL,
  "simplified" TEXT NOT NULL,
  "traditional" TEXT,
  "pinyin" TEXT NOT NULL,
  "pinyinNumber" TEXT NOT NULL,
  "hskLevel" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "ChineseWordExtension_pkey" PRIMARY KEY ("learningItemId"),
  CONSTRAINT "ChineseWordExtension_learningItemId_fkey" FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChineseWordExtension_hskLevel_idx" ON "ChineseWordExtension"("hskLevel");
CREATE INDEX IF NOT EXISTS "ChineseWordExtension_simplified_idx" ON "ChineseWordExtension"("simplified");

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "levelLabel" TEXT;
DO $$ BEGIN
  ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Lesson_courseId_idx" ON "Lesson"("courseId");

CREATE TABLE IF NOT EXISTS "LessonLearningItem" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "learningItemId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "LessonLearningItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LessonLearningItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LessonLearningItem_learningItemId_fkey" FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "LessonLearningItem_lessonId_learningItemId_key" ON "LessonLearningItem"("lessonId", "learningItemId");

-- ReviewCard: wordId 可空 + learningItemId
ALTER TABLE "ReviewCard" ALTER COLUMN "wordId" DROP NOT NULL;
ALTER TABLE "ReviewCard" ADD COLUMN IF NOT EXISTS "learningItemId" TEXT;
DO $$ BEGIN
  ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_learningItemId_fkey"
    FOREIGN KEY ("learningItemId") REFERENCES "LearningItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "ReviewCard_userId_learningItemId_key" ON "ReviewCard"("userId", "learningItemId");
CREATE INDEX IF NOT EXISTS "ReviewCard_learningItemId_idx" ON "ReviewCard"("learningItemId");

ALTER TABLE "PersonCard" ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
DO $$ BEGIN
  ALTER TABLE "PersonCard" ADD CONSTRAINT "PersonCard_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "PersonCard_coupleId_idx" ON "PersonCard"("coupleId");

ALTER TABLE "WishItem" ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
DO $$ BEGIN
  ALTER TABLE "WishItem" ADD CONSTRAINT "WishItem_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "WishItem_coupleId_idx" ON "WishItem"("coupleId");

ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Homework" ADD CONSTRAINT "Homework_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Homework" ADD CONSTRAINT "Homework_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Homework_coupleId_idx" ON "Homework"("coupleId");

ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "importId" TEXT;
DO $$ BEGIN
  ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_subjectId_fkey"
    FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_subjectId_scope_coupleId_idx" ON "KnowledgeChunk"("subjectId", "scope", "coupleId");
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_importId_idx" ON "KnowledgeChunk"("importId");

ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "coupleId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
DO $$ BEGIN
  ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_coupleId_fkey"
    FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "ChatSession_coupleId_idx" ON "ChatSession"("coupleId");

CREATE TABLE IF NOT EXISTS "CorpusImport" (
  "id" TEXT NOT NULL,
  "coupleId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "uploadedByUserId" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT,
  "extension" TEXT,
  "parseMode" TEXT,
  "preset" TEXT,
  "paramVersion" TEXT NOT NULL DEFAULT 'chunker.v1',
  "status" TEXT NOT NULL DEFAULT 'preview',
  "totalChunks" INTEGER NOT NULL DEFAULT 0,
  "processedChunks" INTEGER NOT NULL DEFAULT 0,
  "nextChunkIndex" INTEGER NOT NULL DEFAULT 0,
  "embedBatchSize" INTEGER NOT NULL DEFAULT 32,
  "lastError" TEXT,
  "contentHash" TEXT,
  "cancelRequested" BOOLEAN NOT NULL DEFAULT false,
  "heartbeatAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CorpusImport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CorpusImport_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CorpusImport_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CorpusImport_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CorpusImport_coupleId_status_idx" ON "CorpusImport"("coupleId", "status");
CREATE INDEX IF NOT EXISTS "CorpusImport_status_createdAt_idx" ON "CorpusImport"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_importId_fkey"
    FOREIGN KEY ("importId") REFERENCES "CorpusImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ImportChunk" (
  "id" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "idx" INTEGER NOT NULL,
  "content" TEXT,
  "contentHash" TEXT,
  CONSTRAINT "ImportChunk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ImportChunk_importId_fkey" FOREIGN KEY ("importId") REFERENCES "CorpusImport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ImportChunk_importId_idx_key" ON "ImportChunk"("importId", "idx");

CREATE TABLE IF NOT EXISTS "OutboxEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");
