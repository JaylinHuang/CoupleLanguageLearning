import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell, StatCard } from "@/components/layout";
import { prisma } from "@/lib/db";
import { isSameDay, startOfDay } from "@/lib/srs";

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  const erika = await prisma.user.findUnique({
    where: { username: "erika" },
    include: { progress: true },
  });

  const dueReviews = erika
    ? await prisma.reviewCard.count({
        where: { userId: erika.id, dueDate: { lte: new Date() } },
      })
    : 0;

  const completedLessons = erika
    ? await prisma.lessonProgress.count({
        where: { userId: erika.id, status: "COMPLETED" },
      })
    : 0;

  const openWishes = await prisma.wishItem.count({
    where: { status: "OPEN" },
  });

  const hardWords = erika
    ? await prisma.reviewCard.count({
        where: { userId: erika.id, markedHard: true },
      })
    : 0;

  const unreadNotifications = await prisma.notification.count({
    where: { userId: admin.id, read: false },
  });

  const studiedToday =
    erika?.progress?.lastStudyDate &&
    isSameDay(
      startOfDay(erika.progress.lastStudyDate),
      startOfDay(new Date()),
    );

  const notifications = await prisma.notification.findMany({
    where: { userId: admin.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell title="Admin Dashboard" subtitle="Erika's learning overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Erika today"
            value={studiedToday ? "Studied ✓" : "Not yet"}
          />
          <StatCard label="Streak" value={`${erika?.progress?.streak ?? 0} days`} />
          <StatCard label="Level" value={erika?.progress?.level ?? 1} />
          <StatCard label="Unread alerts" value={unreadNotifications} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Lessons done" value={completedLessons} />
          <StatCard label="Due reviews" value={dueReviews} />
          <StatCard label="Hard words" value={hardWords} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-4">
            <h2 className="font-medium text-warm-brown">Quick links</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/admin/lessons" className="btn-secondary">
                Manage lessons
              </Link>
              <Link href="/admin/vocabulary" className="btn-secondary">
                Add words
              </Link>
              <Link href="/admin/homework" className="btn-secondary">
                Homework
              </Link>
              <Link href="/admin/progress" className="btn-secondary">
                Progress & wishes ({openWishes})
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-medium text-warm-brown">Recent notifications</h2>
            <ul className="mt-3 space-y-2">
              {notifications.length === 0 ? (
                <li className="text-sm text-warm-gray">No notifications yet.</li>
              ) : (
                notifications.map((n) => (
                  <li key={n.id} className="border-b border-blush/40 pb-2 text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-warm-gray">{n.message}</p>
                    <p className="text-xs text-warm-gray">
                      {n.createdAt.toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </PageShell>
    </>
  );
}
