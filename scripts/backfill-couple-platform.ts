/**
 * 回填：Subject chinese、默认 Course、demo-couple、
 * Word→LearningItem、Lesson.courseId、KnowledgeChunk SHARED、ReviewCard.learningItemId
 *
 * 用法：npx tsx scripts/backfill-couple-platform.ts
 * 需先执行 prisma/migrations_manual/add_couple_platform.sql 并 prisma generate
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function templateId() {
  return `tpl_${randomBytes(6).toString("hex")}`;
}

/** 优先 tutor/learner，兼容旧 seed 的 lin/erika */
async function resolveSeedUsers() {
  const tutor =
    (await prisma.user.findUnique({ where: { username: "tutor" } })) ??
    (await prisma.user.findUnique({ where: { username: "lin" } }));
  const learner =
    (await prisma.user.findUnique({ where: { username: "learner" } })) ??
    (await prisma.user.findUnique({ where: { username: "erika" } }));
  if (!tutor || !learner) {
    throw new Error(
      "缺少 seed 用户 tutor/learner（或旧账号 lin/erika），请先 npm run db:seed",
    );
  }
  return { tutor, learner };
}

async function main() {
  await prisma.subject.upsert({
    where: { id: "chinese" },
    update: { name: "Chinese (Mandarin)" },
    create: {
      id: "chinese",
      name: "Chinese (Mandarin)",
      practiceModules: JSON.stringify([
        "handwriting",
        "dictation",
        "listening",
        "typing",
        "smart-quiz",
        "roleplay",
        "writing",
      ]),
    },
  });

  const { tutor, learner } = await resolveSeedUsers();

  await prisma.user.update({
    where: { id: learner.id },
    data: {
      email: learner.email ?? "learner@local.dev",
      emailVerified: learner.emailVerified ?? new Date(),
      platformRole: "MEMBER",
      role: "LEARNER",
    },
  });
  await prisma.user.update({
    where: { id: tutor.id },
    data: {
      email: tutor.email ?? "tutor@local.dev",
      emailVerified: tutor.emailVerified ?? new Date(),
      platformRole: "MEMBER",
      role: "ADMIN",
    },
  });

  const opsPasswordHint = "请用 seed 创建 ops 账号";
  let ops = await prisma.user.findUnique({ where: { username: "ops" } });
  if (!ops) {
    console.log(`跳过 ops 用户创建（由 seed 负责）。${opsPasswordHint}`);
  } else {
    await prisma.user.update({
      where: { id: ops.id },
      data: { platformRole: "PLATFORM_ADMIN", email: ops.email ?? "ops@local.dev" },
    });
  }

  let couple =
    (await prisma.couple.findUnique({ where: { slug: "demo-couple" } })) ??
    (await prisma.couple.findUnique({ where: { slug: "jaylin-erika" } }));
  if (!couple) {
    couple = await prisma.couple.create({
      data: {
        slug: "demo-couple",
        displayName: "Demo Couple",
        status: "ACTIVE",
        siteTitle: "CoupleLearn",
        learnerNickname: "老婆",
        tutorNickname: "Tutor",
        memberships: {
          create: [
            { userId: tutor.id, role: "TUTOR" },
            { userId: learner.id, role: "LEARNER" },
          ],
        },
      },
    });
  } else if (couple.slug === "jaylin-erika") {
    // 旧 slug 迁移为通用 demo-couple（若目标 slug 已占用则仅更新展示字段）
    const taken = await prisma.couple.findUnique({ where: { slug: "demo-couple" } });
    couple = await prisma.couple.update({
      where: { id: couple.id },
      data: {
        slug: taken && taken.id !== couple.id ? couple.slug : "demo-couple",
        displayName: "Demo Couple",
        siteTitle: "CoupleLearn",
        tutorNickname: "Tutor",
      },
    });
  }

  let course = await prisma.course.findFirst({
    where: { subjectId: "chinese", visibility: "SHARED_TEMPLATE", title: "HSK Path" },
  });
  if (!course) {
    course = await prisma.course.create({
      data: {
        subjectId: "chinese",
        title: "HSK Path",
        description: "Shared Mandarin path (HSK-oriented)",
        visibility: "SHARED_TEMPLATE",
        templateId: templateId(),
        templateVersion: 1,
        published: true,
        order: 0,
      },
    });
  }

  await prisma.enrollment.upsert({
    where: {
      coupleId_courseId: { coupleId: couple.id, courseId: course.id },
    },
    update: { status: "ACTIVE", levelLabel: "HSK1" },
    create: {
      coupleId: couple.id,
      courseId: course.id,
      status: "ACTIVE",
      levelLabel: "HSK1",
    },
  });

  await prisma.lesson.updateMany({
    where: { courseId: null },
    data: { courseId: course.id, levelLabel: "HSK1" },
  });

  const words = await prisma.word.findMany();
  let itemCount = 0;
  for (const w of words) {
    const sourceRef = `word:${w.id}`;
    let item = await prisma.learningItem.findFirst({ where: { sourceRef } });
    if (!item) {
      item = await prisma.learningItem.create({
        data: {
          subjectId: "chinese",
          itemType: "chinese_word",
          title: w.simplified,
          meaningPrimary: w.english,
          meaningSecondary: w.tagalogShort,
          tags: JSON.stringify(w.isCustom ? ["custom"] : ["hsk"]),
          audioUrl: w.audioUrl,
          notes: w.notes,
          scope: w.isCustom ? "COUPLE" : "SHARED",
          ownerCoupleId: w.isCustom ? couple.id : null,
          sourceRef,
          chineseExt: {
            create: {
              simplified: w.simplified,
              traditional: w.traditional,
              pinyin: w.pinyin,
              pinyinNumber: w.pinyinNumber,
              hskLevel: w.hskLevel,
            },
          },
        },
      });
      itemCount += 1;
    }

    await prisma.reviewCard.updateMany({
      where: { wordId: w.id, learningItemId: null },
      data: { learningItemId: item.id },
    });

    const lessonWords = await prisma.lessonWord.findMany({ where: { wordId: w.id } });
    for (const lw of lessonWords) {
      await prisma.lessonLearningItem.upsert({
        where: {
          lessonId_learningItemId: {
            lessonId: lw.lessonId,
            learningItemId: item.id,
          },
        },
        update: { order: lw.order },
        create: {
          lessonId: lw.lessonId,
          learningItemId: item.id,
          order: lw.order,
        },
      });
    }
  }

  await prisma.knowledgeChunk.updateMany({
    where: { subjectId: null },
    data: { subjectId: "chinese", scope: "SHARED", coupleId: null },
  });

  await prisma.personCard.updateMany({
    where: { coupleId: null },
    data: { coupleId: couple.id },
  });

  await prisma.wishItem.updateMany({
    where: { coupleId: null },
    data: { coupleId: couple.id },
  });

  await prisma.homework.updateMany({
    where: { coupleId: null },
    data: { coupleId: couple.id, assigneeId: learner.id },
  });

  console.log(
    JSON.stringify(
      {
        coupleId: couple.id,
        courseId: course.id,
        words: words.length,
        learningItemsCreated: itemCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
