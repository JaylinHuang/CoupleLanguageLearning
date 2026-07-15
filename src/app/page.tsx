import Link from "next/link";
import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell, StatCard } from "@/components/layout";
import { prisma } from "@/lib/db";
import { xpProgressInLevel } from "@/lib/constants";
import { isSameDay, startOfDay } from "@/lib/srs";

export default async function HomePage() {
  const user = await requireLearner();

  const progress = await prisma.userProgress.findUnique({
    where: { userId: user.id },
  });

  const dueReviews = await prisma.reviewCard.count({
    where: { userId: user.id, dueDate: { lte: new Date() } },
  });

  const nextLesson = await prisma.lesson.findFirst({
    where: {
      published: true,
      NOT: {
        progress: {
          some: { userId: user.id, status: "COMPLETED" },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const openHomework = await prisma.homework.count({
    where: {
      status: { in: ["ASSIGNED", "SUBMITTED"] },
      NOT: {
        submissions: { some: { userId: user.id } },
      },
    },
  });

  // 最近错题数量（供次要任务提示）
  const recentAttempts = await prisma.lessonAttempt.findMany({
    where: { userId: user.id },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: { answers: true },
  });
  let mistakeCount = 0;
  for (const a of recentAttempts) {
    try {
      const answers = JSON.parse(a.answers) as Array<{ isCorrect: boolean }>;
      mistakeCount += answers.filter((x) => !x.isCorrect).length;
    } catch {
      // 忽略坏数据
    }
  }

  const xpInfo = xpProgressInLevel(progress?.xp ?? 0);
  const studiedToday =
    progress?.lastStudyDate &&
    isSameDay(startOfDay(progress.lastStudyDate), startOfDay(new Date()));

  // 主任务优先级：到期复习 > 下一课
  const mainTask =
    dueReviews > 0
      ? {
          href: "/review",
          title: "Review cards",
          subtitle: `${dueReviews} cards waiting · ~5 min`,
          cta: "Start review",
          badge: "Main task",
        }
      : nextLesson
        ? {
            href: `/learn/${nextLesson.id}`,
            title: nextLesson.title,
            subtitle:
              nextLesson.description ?? "Continue your next lesson · ~10 min",
            cta: "Start lesson",
            badge: nextLesson.sceneTag === "couple" ? "With Lin 💕" : "Main task",
          }
        : {
            href: "/practice",
            title: "All lessons complete!",
            subtitle: "Practice what you know, or ask Lin for more content.",
            cta: "Open Practice",
            badge: "Main task",
          };

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Today's Plan"
        subtitle="One main task · Mag-focus sa isang gawain"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Streak"
            value={`${progress?.streak ?? 0} days`}
            hint="Keep going!"
          />
          <StatCard
            label="Level"
            value={xpInfo.level}
            hint={`${xpInfo.current}/${xpInfo.needed} XP`}
          />
          <StatCard label="Due reviews" value={dueReviews} />
          <StatCard
            label="Today"
            value={studiedToday ? "Done ✓" : "Not yet"}
            hint={studiedToday ? "Great job!" : "Start when you're ready"}
          />
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-medium text-warm-brown">
            Do this first
          </h2>
          <Link
            href={mainTask.href}
            className="card block border-coral/40 bg-gradient-to-br from-white to-blush/40 p-5 transition hover:shadow-md"
          >
            <span className="badge mb-2">{mainTask.badge}</span>
            <p className="text-xl font-semibold text-warm-brown">
              {mainTask.title}
            </p>
            <p className="mt-1 text-sm text-warm-gray">{mainTask.subtitle}</p>
            <span className="btn-primary mt-4 inline-flex">{mainTask.cta}</span>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-medium text-warm-brown">Also today</h2>

          {openHomework > 0 ? (
            <Link
              href="/homework"
              className="card block p-4 transition hover:shadow-md"
            >
              <p className="font-medium">Homework from Lin</p>
              <p className="text-sm text-warm-gray">
                {openHomework} pending · Takdang-aralin
              </p>
            </Link>
          ) : null}

          {mistakeCount > 0 ? (
            <Link
              href="/mistakes"
              className="card block p-4 transition hover:shadow-md"
            >
              <p className="font-medium">Review my mistakes</p>
              <p className="text-sm text-warm-gray">
                {mistakeCount} recent wrong answers · Mga mali
              </p>
            </Link>
          ) : null}

          {dueReviews === 0 && nextLesson ? (
            <Link
              href="/practice"
              className="card block p-4 transition hover:shadow-md"
            >
              <p className="font-medium">Extra practice</p>
              <p className="text-sm text-warm-gray">
                Dictation · Roleplay · Writing · Smart Quiz
              </p>
            </Link>
          ) : null}

          {dueReviews > 0 && nextLesson ? (
            <Link
              href={`/learn/${nextLesson.id}`}
              className="card block p-4 transition hover:shadow-md"
            >
              <p className="font-medium">After review: {nextLesson.title}</p>
              <p className="text-sm text-warm-gray">
                {nextLesson.description ?? "Your next lesson"}
              </p>
            </Link>
          ) : null}

          <Link
            href="/practice/ai"
            className="card block p-4 transition hover:shadow-md"
          >
            <p className="font-medium">Chat with Lin AI 💕</p>
            <p className="text-sm text-warm-gray">Relaxed Mandarin conversation</p>
          </Link>
        </div>
      </PageShell>
    </>
  );
}
