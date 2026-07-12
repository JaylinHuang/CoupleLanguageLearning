import { requireLearner } from "@/app/actions/auth";
import { SiteHeader, PageShell, StatCard } from "@/components/layout";
import { prisma } from "@/lib/db";
import { xpProgressInLevel, BADGES } from "@/lib/constants";

export default async function ProfilePage() {
  const user = await requireLearner();

  const progress = await prisma.userProgress.findUnique({
    where: { userId: user.id },
  });

  const achievements = await prisma.achievement.findMany({
    where: { userId: user.id },
  });

  const unlocked = new Set(achievements.map((a) => a.badgeId));
  const xpInfo = xpProgressInLevel(progress?.xp ?? 0);

  return (
    <>
      <SiteHeader user={user} />
      <PageShell title="Profile" subtitle="Your progress & rewards">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Level" value={xpInfo.level} />
          <StatCard label="Total XP" value={progress?.xp ?? 0} />
          <StatCard
            label="Longest streak"
            value={`${progress?.longestStreak ?? 0} days`}
          />
        </div>

        <div className="mt-4 card p-4">
          <p className="text-sm text-warm-gray">Level progress</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-blush">
            <div
              className="h-full rounded-full bg-coral transition-all"
              style={{ width: `${xpInfo.percent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-warm-gray">
            {xpInfo.current} / {xpInfo.needed} XP to next level
          </p>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-lg font-medium text-warm-brown">Achievements</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {BADGES.map((badge) => (
              <div
                key={badge.id}
                className={`card p-4 ${unlocked.has(badge.id) ? "" : "opacity-50"}`}
              >
                <p className="font-medium">{badge.name}</p>
                <p className="text-sm text-warm-gray">{badge.description}</p>
                {unlocked.has(badge.id) ? (
                  <span className="badge mt-2">Unlocked</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
