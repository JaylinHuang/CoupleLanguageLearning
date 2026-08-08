import { requireAdmin } from "@/app/actions/auth";
import { sendDailyReportAction, sendWeeklyReportAction } from "@/app/actions/learning";
import { SiteHeader, PageShell } from "@/components/layout";
import {
  LessonAttemptHistory,
  type AttemptItem,
  type LegacyProgressItem,
} from "@/components/lesson-attempt-history";
import { VocabProgress } from "@/components/vocab-progress";
import { getCoupleLearnerUserId } from "@/lib/couple";
import { prisma } from "@/lib/db";
import { getVocabStats } from "@/lib/vocab-stats";
import type { QuizAnswerDetail } from "@/lib/types";

type GrammarResult = {
  corrected: string;
  errors: Array<{ original: string; fixed: string; explanation: string }>;
  praise: string;
};

export default async function AdminProgressPage() {
  const admin = await requireAdmin();

  const learnerId = admin.coupleId
    ? await getCoupleLearnerUserId(admin.coupleId)
    : (
        await prisma.user.findFirst({ where: { role: "LEARNER" } })
      )?.id;
  const learner = learnerId
    ? await prisma.user.findUnique({
        where: { id: learnerId },
        include: { progress: true },
      })
    : null;

  const wishes = await prisma.wishItem.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { displayName: true } } },
  });

  const hardCards = (
    learner
      ? await prisma.reviewCard.findMany({
          where: { userId: learner.id, markedHard: true },
          include: { word: true },
        })
      : []
  ).filter((c): c is typeof c & { word: NonNullable<typeof c.word> } => c.word != null);

  // 每次答题的完整记录（新数据，可查看逐题详情）
  const attemptRows = learner
    ? await prisma.lessonAttempt.findMany({
        where: { userId: learner.id },
        include: { lesson: { select: { title: true } } },
        orderBy: { completedAt: "desc" },
      })
    : [];

  const attempts: AttemptItem[] = attemptRows.map((a) => {
    let answers: QuizAnswerDetail[] = [];
    try {
      answers = JSON.parse(a.answers) as QuizAnswerDetail[];
    } catch {
      // 数据异常时按无详情处理
    }
    return {
      id: a.id,
      lessonTitle: a.lesson.title,
      score: a.score,
      completedAt: a.completedAt.toISOString(),
      answers,
    };
  });

  // 旧记录：功能上线前完成的课程只有汇总进度，没有逐题数据
  const attemptLessonIds = new Set(attemptRows.map((a) => a.lessonId));
  const legacyRows = learner
    ? await prisma.lessonProgress.findMany({
        where: { userId: learner.id, lessonId: { notIn: [...attemptLessonIds] } },
        include: { lesson: { select: { title: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const legacy: LegacyProgressItem[] = legacyRows.map((lp) => ({
    id: lp.id,
    lessonTitle: lp.lesson.title,
    status: lp.status,
    score: lp.score,
  }));

  // 词汇量统计 + 最近的写作纠错练习
  const vocabStats = learner ? await getVocabStats(learner.id) : [];
  const grammarRows = learner
    ? await prisma.grammarCorrection.findMany({
        where: { userId: learner.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Progress" subtitle="Wishes, hard words, lesson history">
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <form action={sendDailyReportAction}>
            <button
              type="submit"
              className="btn-secondary text-xs"
              title="汇总今天学习进度并发送到你的邮箱"
            >
              📧 Send daily report now
            </button>
          </form>
          <form action={sendWeeklyReportAction}>
            <button
              type="submit"
              className="btn-secondary text-xs"
              title="生成本周学习汇总并发送到你的邮箱"
            >
              📧 Send weekly report now
            </button>
          </form>
        </div>
        {learner?.progress ? (
          <div className="card mb-6 grid gap-2 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-warm-gray">XP</p>
              <p className="text-xl font-semibold">{learner.progress.xp}</p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">Level</p>
              <p className="text-xl font-semibold">{learner.progress.level}</p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">Streak</p>
              <p className="text-xl font-semibold">{learner.progress.streak}</p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">HSK focus</p>
              <p className="text-xl font-semibold">HSK {learner.progress.hskLevel}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 font-medium text-warm-brown">Learning wishes</h2>
            <div className="space-y-2">
              {wishes.length === 0 ? (
                <p className="text-sm text-warm-gray">No open wishes.</p>
              ) : (
                wishes.map((w) => (
                  <div key={w.id} className="card p-3 text-sm">
                    <p>{w.text}</p>
                    <p className="mt-1 text-xs text-warm-gray">
                      {w.user.displayName} · {w.createdAt.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-medium text-warm-brown">Hard words</h2>
            <div className="space-y-2">
              {hardCards.length === 0 ? (
                <p className="text-sm text-warm-gray">None marked yet.</p>
              ) : (
                hardCards.map((c) => (
                  <div key={c.id} className="card p-3">
                    <p className="font-chinese text-lg">{c.word.simplified}</p>
                    <p className="text-sm text-warm-gray">{c.word.english}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {vocabStats.length > 0 ? (
          <div className="mt-6">
            <VocabProgress stats={vocabStats} />
          </div>
        ) : null}

        <div className="mt-6">
          <h2 className="mb-3 font-medium text-warm-brown">Lesson history</h2>
          <p className="mb-2 text-xs text-warm-gray">
            Click a record to see every question, the learner&apos;s answer and
            the correct answer.
          </p>
          <LessonAttemptHistory attempts={attempts} legacy={legacy} />
        </div>

        <div className="mt-6">
          <h2 className="mb-3 font-medium text-warm-brown">
            Writing practice (AI corrections)
          </h2>
          <div className="space-y-2">
            {grammarRows.length === 0 ? (
              <p className="text-sm text-warm-gray">
                No writing practice yet.
              </p>
            ) : (
              grammarRows.map((g) => {
                let result: GrammarResult | null = null;
                try {
                  result = JSON.parse(g.result) as GrammarResult;
                } catch {
                  // 忽略解析失败的数据
                }
                const errorCount = result?.errors.length ?? 0;
                return (
                  <div key={g.id} className="card p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-chinese">{g.inputText}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                          errorCount === 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {errorCount === 0 ? "Perfect" : `${errorCount} errors`}
                      </span>
                    </div>
                    {result && errorCount > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-warm-gray">
                        <p>
                          Corrected:{" "}
                          <span className="font-chinese text-green-700">
                            {result.corrected}
                          </span>
                        </p>
                        {result.errors.map((e, i) => (
                          <p key={i}>
                            <span className="font-chinese text-red-500 line-through">
                              {e.original}
                            </span>{" "}
                            →{" "}
                            <span className="font-chinese text-green-700">
                              {e.fixed}
                            </span>
                          </p>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1 text-xs text-warm-gray">
                      {g.createdAt.toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PageShell>
    </>
  );
}
