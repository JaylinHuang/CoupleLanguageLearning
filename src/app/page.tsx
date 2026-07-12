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

  const xpInfo = xpProgressInLevel(progress?.xp ?? 0);
  const studiedToday =
    progress?.lastStudyDate &&
    isSameDay(startOfDay(progress.lastStudyDate), startOfDay(new Date()));

  return (
    <>
      <SiteHeader user={user} />
      <PageShell
        title="Today's Plan"
        subtitle="~15 minutes · Mag-aral ng ~15 minuto"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Streak" value={`${progress?.streak ?? 0} days`} hint="Keep going!" />
          <StatCard label="Level" value={xpInfo.level} hint={`${xpInfo.current}/${xpInfo.needed} XP`} />
          <StatCard label="Due reviews" value={dueReviews} />
          <StatCard
            label="Today"
            value={studiedToday ? "Done ✓" : "Not yet"}
            hint={studiedToday ? "Great job!" : "Start when you're ready"}
          />
        </div>

        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-medium text-warm-brown">Today&apos;s tasks</h2>

          {dueReviews > 0 ? (
            <Link href="/review" className="card block p-4 transition hover:shadow-md">
              <p className="font-medium">Review cards</p>
              <p className="text-sm text-warm-gray">{dueReviews} cards waiting</p>
            </Link>
          ) : null}

          {nextLesson ? (
            <Link
              href={`/learn/${nextLesson.id}`}
              className="card block p-4 transition hover:shadow-md"
            >
              <p className="font-medium">{nextLesson.title}</p>
              <p className="text-sm text-warm-gray">{nextLesson.description}</p>
              {nextLesson.sceneTag === "couple" ? (
                <span className="badge mt-2">With Lin 💕</span>
              ) : null}
            </Link>
          ) : (
            <div className="card p-4">
              <p className="font-medium">All lessons complete!</p>
              <p className="text-sm text-warm-gray">Ask Lin for more content.</p>
            </div>
          )}

          {openHomework > 0 ? (
            <Link href="/homework" className="card block p-4 transition hover:shadow-md">
              <p className="font-medium">Homework from Lin</p>
              <p className="text-sm text-warm-gray">{openHomework} pending</p>
            </Link>
          ) : null}

          <Link href="/people" className="card block p-4 transition hover:shadow-md">
            <p className="font-medium">Practice with Lin&apos;s phrases</p>
            <p className="text-sm text-warm-gray">See what he usually says</p>
          </Link>

          <Link href="/listening" className="card block p-4 transition hover:shadow-md">
            <p className="font-medium">Listening quiz</p>
            <p className="text-sm text-warm-gray">听中文选意思 · ~5 min</p>
          </Link>

          <Link href="/speaking" className="card block p-4 transition hover:shadow-md">
            <p className="font-medium">Speaking practice</p>
            <p className="text-sm text-warm-gray">跟读 + 录音对比</p>
          </Link>

          <Link href="/typing" className="card block p-4 transition hover:shadow-md">
            <p className="font-medium">Typing practice</p>
            <p className="text-sm text-warm-gray">Pinyin with number tones</p>
          </Link>

          <Link href="/practice/ai" className="card block p-4 transition hover:shadow-md">
            <p className="font-medium">Chat with Lin AI 💕</p>
            <p className="text-sm text-warm-gray">Relaxed Mandarin conversation</p>
          </Link>

          <Link href="/culture" className="card block p-4 transition hover:shadow-md">
            <p className="font-medium">Culture & etiquette</p>
            <p className="text-sm text-warm-gray">Meeting family · table manners</p>
          </Link>
        </div>
      </PageShell>
    </>
  );
}
