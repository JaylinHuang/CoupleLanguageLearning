/** 平台 / 情侣角色常量 */

export type PlatformRole = "MEMBER" | "PLATFORM_ADMIN";
export type CoupleMemberRole = "TUTOR" | "LEARNER";
/** 遗留页面角色：过渡期仍写入 JWT */
export type LegacyUserRole = "LEARNER" | "ADMIN";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: LegacyUserRole;
  email?: string | null;
  platformRole: PlatformRole;
  coupleId?: string | null;
  coupleRole?: CoupleMemberRole | null;
  coupleStatus?: string | null;
};

export const COUPLE_STATUS = {
  PENDING_VERIFY: "PENDING_VERIFY",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  DISSOLVED: "DISSOLVED",
} as const;

export const COURSE_VISIBILITY = {
  SHARED_TEMPLATE: "SHARED_TEMPLATE",
  COUPLE_PRIVATE: "COUPLE_PRIVATE",
} as const;

export const KNOWLEDGE_SCOPE = {
  SHARED: "SHARED",
  COUPLE: "COUPLE",
} as const;
