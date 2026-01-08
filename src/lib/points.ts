export const POINTS = {
  DAILY_CHECKIN: 10,
  STREAK_7: 50,
  STREAK_30: 200,
  STREAK_100: 1000,
  PARTNER_SYNC: 5,
} as const;

export function getStreakBonus(streakCount: number): number {
  if (streakCount === 100) return POINTS.STREAK_100;
  if (streakCount === 30) return POINTS.STREAK_30;
  if (streakCount === 7) return POINTS.STREAK_7;
  return 0;
}

export function getStreakMilestone(streakCount: number): string | null {
  if (streakCount === 100) return "100 Day Streak!";
  if (streakCount === 30) return "30 Day Streak!";
  if (streakCount === 7) return "7 Day Streak!";
  return null;
}

export function isStreakMilestone(streakCount: number): boolean {
  return streakCount === 7 || streakCount === 30 || streakCount === 100;
}
