import Link from "next/link";
import { requireAdmin } from "@/app/actions/auth";
import { SiteHeader, PageShell, StatCard } from "@/components/layout";
import { prisma } from "@/lib/db";
import { getCoupleLearnerUserId } from "@/lib/couple";
import { isSameDay, startOfDay } from "@/lib/srs";

export default async function AdminDashboard() {
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

  const dueReviews = learner
    ? await prisma.reviewCard.count({
        where: { userId: learner.id, dueDate: { lte: new Date() } },
      })
    : 0;

  const completedLessons = learner
    ? await prisma.lessonProgress.count({
        where: { userId: learner.id, status: "COMPLETED" },
      })
    : 0;

  const openWishes = await prisma.wishItem.count({
    where: { status: "OPEN" },
  });

  const hardWords = learner
    ? await prisma.reviewCard.count({
        where: { userId: learner.id, markedHard: true },
      })
    : 0;

  const unreadNotifications = await prisma.notification.count({
    where: { userId: admin.id, read: false },
  });

  const studiedToday =
    learner?.progress?.lastStudyDate &&
    isSameDay(
      startOfDay(learner.progress.lastStudyDate),
      startOfDay(new Date()),
    );

  const notifications = await prisma.notification.findMany({
    where: { userId: admin.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const learnerLabel = learner?.displayName ?? "Learner";

  return (
    <>
      <SiteHeader user={admin} admin />
      <PageShell
        title="Tutor Dashboard"
        subtitle={`${learnerLabel}'s learning overview`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={`${learnerLabel} today`}
            value={studiedToday ? "Studied ✓" : "Not yet"}
          />
          <StatCard label="Streak" value={`${learner?.progress?.streak ?? 0} days`} />
          <StatCard label="Level" value={learner?.progress?.level ?? 1} />
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
                Vocabulary
              </Link>
              <Link href="/admin/homework" className="btn-secondary">
                Homework
              </Link>
              <Link href="/admin/progress" className="btn-secondary">
                Progress
              </Link>
            </div>
            <p className="mt-3 text-xs text-warm-gray">Open wishes: {openWishes}</p>
          </div>

          <div className="card p-4">
            <h2 className="font-medium text-warm-brown">Recent notifications</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {notifications.length === 0 ? (
                <li className="text-warm-gray">No notifications yet.</li>
              ) : (
                notifications.map((n) => (
                  <li key={n.id} className="border-b border-blush/40 pb-2">
                    <p className="font-medium text-warm-brown">{n.title}</p>
                    <p className="text-warm-gray">{n.message}</p>
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
