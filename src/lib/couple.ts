import { prisma } from "@/lib/db";
import type { CoupleMemberRole, SessionUser } from "@/lib/platform";
import { COUPLE_STATUS } from "@/lib/platform";

export async function getMembershipForUser(userId: string) {
  return prisma.coupleMembership.findUnique({
    where: { userId },
    include: { couple: true },
  });
}

export async function requireActiveCoupleContext(session: SessionUser) {
  const membership = await getMembershipForUser(session.id);
  if (!membership || membership.couple.status !== COUPLE_STATUS.ACTIVE) {
    return null;
  }
  return membership;
}

export async function getCoupleLearnerUserId(coupleId: string) {
  const m = await prisma.coupleMembership.findUnique({
    where: { coupleId_role: { coupleId, role: "LEARNER" } },
  });
  return m?.userId ?? null;
}

export async function getCoupleTutorUserId(coupleId: string) {
  const m = await prisma.coupleMembership.findUnique({
    where: { coupleId_role: { coupleId, role: "TUTOR" } },
  });
  return m?.userId ?? null;
}

/** 根据 learner 用户找到同对 tutor；找不到则回退任意 TUTOR membership */
export async function resolveTutorUserForLearner(learnerUserId: string) {
  const membership = await prisma.coupleMembership.findUnique({
    where: { userId: learnerUserId },
  });
  if (membership) {
    const tutorId = await getCoupleTutorUserId(membership.coupleId);
    if (tutorId) return prisma.user.findUnique({ where: { id: tutorId } });
  }
  const anyTutor = await prisma.coupleMembership.findFirst({
    where: { role: "TUTOR" },
  });
  if (anyTutor) return prisma.user.findUnique({ where: { id: anyTutor.userId } });
  return prisma.user.findFirst({ where: { role: "ADMIN", platformRole: "MEMBER" } });
}

/** 解析默认学习情侣的 learner（迁移期兼容旧 cron） */
export async function resolveDefaultLearnerUser() {
  const couple = await prisma.couple.findFirst({
    where: { status: COUPLE_STATUS.ACTIVE },
    orderBy: { createdAt: "asc" },
    include: { memberships: true },
  });
  if (couple) {
    const learner = couple.memberships.find((m) => m.role === "LEARNER");
    if (learner) {
      return prisma.user.findUnique({ where: { id: learner.userId } });
    }
  }
  return prisma.user.findFirst({ where: { role: "LEARNER" } });
}

export function membershipRoleToLegacy(
  role: CoupleMemberRole,
): "LEARNER" | "ADMIN" {
  return role === "TUTOR" ? "ADMIN" : "LEARNER";
}
