import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell } from "@/components/layout";
import { prisma } from "@/lib/db";

export default async function AdminProgressPage() {
  const admin = await requireAdmin();

  const erika = await prisma.user.findUnique({
    where: { username: "erika" },
    include: { progress: true },
  });

  const wishes = await prisma.wishItem.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { displayName: true } } },
  });

  const hardCards = erika
    ? await prisma.reviewCard.findMany({
        where: { userId: erika.id, markedHard: true },
        include: { word: true },
      })
    : [];

  const lessonProgress = erika
    ? await prisma.lessonProgress.findMany({
        where: { userId: erika.id },
        include: { lesson: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Progress" subtitle="Wishes, hard words, lesson history">
        {erika?.progress ? (
          <div className="card mb-6 grid gap-2 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-warm-gray">XP</p>
              <p className="text-xl font-semibold">{erika.progress.xp}</p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">Level</p>
              <p className="text-xl font-semibold">{erika.progress.level}</p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">Streak</p>
              <p className="text-xl font-semibold">{erika.progress.streak}</p>
            </div>
            <div>
              <p className="text-xs text-warm-gray">HSK focus</p>
              <p className="text-xl font-semibold">HSK {erika.progress.hskLevel}</p>
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

        <div className="mt-6">
          <h2 className="mb-3 font-medium text-warm-brown">Lesson history</h2>
          <div className="space-y-2">
            {lessonProgress.map((lp) => (
              <div key={lp.id} className="card flex justify-between p-3 text-sm">
                <span>{lp.lesson.title}</span>
                <span className="text-warm-gray">
                  {lp.status}
                  {lp.score != null ? ` · ${lp.score}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
