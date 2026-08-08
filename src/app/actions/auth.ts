"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
} from "@/lib/auth";
import { getMembershipForUser, membershipRoleToLegacy } from "@/lib/couple";
import { COUPLE_STATUS, type SessionUser } from "@/lib/platform";

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || `couple-${randomBytes(3).toString("hex")}`;
}

async function buildSessionUser(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const membership = await getMembershipForUser(userId);
  const coupleRole = membership?.role as SessionUser["coupleRole"];
  const legacyRole =
    user.platformRole === "PLATFORM_ADMIN"
      ? "ADMIN"
      : coupleRole
        ? membershipRoleToLegacy(coupleRole)
        : (user.role as SessionUser["role"]);

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: legacyRole,
    email: user.email,
    platformRole: (user.platformRole as SessionUser["platformRole"]) ?? "MEMBER",
    coupleId: membership?.coupleId ?? null,
    coupleRole: coupleRole ?? null,
    coupleStatus: membership?.couple.status ?? null,
  };
}

export async function loginAction(formData: FormData): Promise<void> {
  const login = String(formData.get("username") ?? formData.get("login") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!login || !password) {
    redirect("/login?error=missing");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: login }, { email: login }],
    },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=invalid");
  }

  const sessionUser = await buildSessionUser(user.id);
  const token = await createSessionToken(sessionUser);
  await setSessionCookie(token);

  if (sessionUser.platformRole === "PLATFORM_ADMIN") redirect("/ops");
  if (sessionUser.coupleRole === "TUTOR" || sessionUser.role === "ADMIN") {
    redirect("/tutor");
  }
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

function isTutorSession(session: SessionUser) {
  if (session.platformRole === "PLATFORM_ADMIN") return false;
  return session.coupleRole === "TUTOR" || session.role === "ADMIN";
}

/** 遗留：原 Admin = Tutor（过渡）；不含 PLATFORM_ADMIN */
export async function requireAdmin() {
  const session = await requireSession();
  if (!isTutorSession(session)) redirect("/");
  if (
    session.coupleStatus &&
    session.coupleStatus !== COUPLE_STATUS.ACTIVE
  ) {
    redirect("/register/pending");
  }
  return session;
}

export async function requireTutor() {
  return requireAdmin();
}

export async function requireLearner() {
  const session = await requireSession();
  const isLearner =
    session.coupleRole === "LEARNER" ||
    (session.role === "LEARNER" && session.coupleRole !== "TUTOR");
  if (!isLearner) redirect("/tutor");
  if (
    session.coupleStatus &&
    session.coupleStatus !== COUPLE_STATUS.ACTIVE
  ) {
    redirect("/register/pending");
  }
  return session;
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (session.platformRole !== "PLATFORM_ADMIN") redirect("/");
  return session;
}

export type RegisterCoupleResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerCoupleAction(
  formData: FormData,
): Promise<RegisterCoupleResult> {
  const coupleName = String(formData.get("coupleName") ?? "").trim();
  const tutorEmail = String(formData.get("tutorEmail") ?? "")
    .trim()
    .toLowerCase();
  const learnerEmail = String(formData.get("learnerEmail") ?? "")
    .trim()
    .toLowerCase();
  const tutorPassword = String(formData.get("tutorPassword") ?? "");
  const learnerPassword = String(formData.get("learnerPassword") ?? "");
  const tutorDisplay = String(formData.get("tutorDisplayName") ?? "").trim();
  const learnerDisplay = String(formData.get("learnerDisplayName") ?? "").trim();

  if (
    !coupleName ||
    !tutorEmail ||
    !learnerEmail ||
    !tutorPassword ||
    !learnerPassword ||
    !tutorDisplay ||
    !learnerDisplay
  ) {
    return { ok: false, error: "missing_fields" };
  }
  if (tutorEmail === learnerEmail) {
    return { ok: false, error: "same_email" };
  }
  if (tutorPassword.length < 8 || learnerPassword.length < 8) {
    return { ok: false, error: "weak_password" };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: tutorEmail }, { email: learnerEmail }] },
  });
  if (existing) return { ok: false, error: "email_taken" };

  const tutorUsername = `t_${randomBytes(4).toString("hex")}`;
  const learnerUsername = `l_${randomBytes(4).toString("hex")}`;
  let slug = slugify(coupleName);
  const slugTaken = await prisma.couple.findUnique({ where: { slug } });
  if (slugTaken) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const tutorHash = await bcrypt.hash(tutorPassword, 10);
  const learnerHash = await bcrypt.hash(learnerPassword, 10);

  const chineseCourse = await prisma.course.findFirst({
    where: { subjectId: "chinese", visibility: "SHARED_TEMPLATE", published: true },
    orderBy: { order: "asc" },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const tutor = await tx.user.create({
        data: {
          username: tutorUsername,
          email: tutorEmail,
          displayName: tutorDisplay,
          passwordHash: tutorHash,
          role: "ADMIN",
          platformRole: "MEMBER",
          progress: { create: {} },
        },
      });
      const learner = await tx.user.create({
        data: {
          username: learnerUsername,
          email: learnerEmail,
          displayName: learnerDisplay,
          passwordHash: learnerHash,
          role: "LEARNER",
          platformRole: "MEMBER",
          progress: { create: {} },
        },
      });

      const couple = await tx.couple.create({
        data: {
          slug,
          displayName: coupleName,
          status: COUPLE_STATUS.PENDING_VERIFY,
          siteTitle: coupleName,
          memberships: {
            create: [
              { userId: tutor.id, role: "TUTOR" },
              { userId: learner.id, role: "LEARNER" },
            ],
          },
        },
      });

      if (chineseCourse) {
        await tx.enrollment.create({
          data: {
            coupleId: couple.id,
            courseId: chineseCourse.id,
            status: "ACTIVE",
          },
        });
      }

      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);
      await tx.emailVerificationToken.createMany({
        data: [
          {
            userId: tutor.id,
            token: randomBytes(24).toString("hex"),
            expiresAt,
          },
          {
            userId: learner.id,
            token: randomBytes(24).toString("hex"),
            expiresAt,
          },
        ],
      });
    });
  } catch (e) {
    console.error("[registerCouple]", e);
    return { ok: false, error: "create_failed" };
  }

  // 开发环境：若未配置 SMTP，打印验证链接到日志；生产发邮件
  const tokens = await prisma.emailVerificationToken.findMany({
    where: {
      user: { email: { in: [tutorEmail, learnerEmail] } },
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });
  for (const t of tokens) {
    const link = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/verify-email?token=${t.token}`;
    console.log(`[verify-email] ${t.user.email}: ${link}`);
  }

  return { ok: true };
}

export async function verifyEmailAction(token: string): Promise<{ ok: boolean; error?: string }> {
  const row = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: { include: { memberships: { include: { couple: true } } } } },
  });
  if (!row || row.expiresAt < new Date()) {
    return { ok: false, error: "invalid_token" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    });
    await tx.emailVerificationToken.delete({ where: { id: row.id } });

    const membership = await tx.coupleMembership.findUnique({
      where: { userId: row.userId },
    });
    if (!membership) return;

    const members = await tx.coupleMembership.findMany({
      where: { coupleId: membership.coupleId },
      include: { user: true },
    });
    if (members.every((m) => Boolean(m.user.emailVerified))) {
      await tx.couple.update({
        where: { id: membership.coupleId },
        data: { status: COUPLE_STATUS.ACTIVE },
      });
    }
  });

  return { ok: true };
}
