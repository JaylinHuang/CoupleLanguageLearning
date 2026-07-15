export type UserRole = "LEARNER" | "ADMIN";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

export const XP_REWARDS = {
  lessonComplete: 25,
  reviewSession: 15,
  listeningQuiz: 10,
  speakingPractice: 10,
  aiChat: 5,
  homeworkSubmit: 20,
  dailyCheckIn: 10,
  dictation: 10,
  smartQuiz: 15,
  roleplay: 10,
  writingCheck: 10,
  handwriting: 10,
} as const;

export const LEVEL_XP_BASE = 100;

export function xpForLevel(level: number): number {
  return level * LEVEL_XP_BASE;
}

export function calculateLevel(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return level;
}

export function xpProgressInLevel(xp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = calculateLevel(xp);
  let spent = 0;
  for (let l = 1; l < level; l += 1) spent += xpForLevel(l);
  const current = xp - spent;
  const needed = xpForLevel(level);
  return {
    level,
    current,
    needed,
    percent: Math.min(100, Math.round((current / needed) * 100)),
  };
}

export const BADGES = [
  { id: "first_lesson", name: "First Step", description: "Complete your first lesson" },
  { id: "streak_7", name: "Week of Love", description: "7-day study streak" },
  { id: "lin_phrases", name: "Lin's Words", description: "Learn 10 couple phrases" },
  { id: "hsk1_30", name: "HSK1 Explorer", description: "30% of HSK1 vocabulary" },
] as const;
