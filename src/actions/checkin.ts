"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { POINTS, getStreakBonus, getStreakMilestone } from "@/lib/points";
import { format, subDays, parseISO } from "date-fns";

interface CheckinData {
  mood: number;
  wins: string | null;
  struggles: string | null;
  focus: string | null;
  userId: string;
}

export async function submitCheckin(data: CheckinData) {
  if (!data.userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const userId = data.userId;
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if user already checked in today
  const { data: existingCheckin } = await supabase
    .from("checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .single();

  const isUpdate = !!existingCheckin;

  // Upsert checkin
  const { error: checkinError } = await supabase.from("checkins").upsert(
    {
      user_id: userId,
      checkin_date: today,
      mood: data.mood,
      wins: data.wins,
      struggles: data.struggles,
      focus: data.focus,
    },
    {
      onConflict: "user_id,checkin_date",
    }
  );

  if (checkinError) {
    console.error("Checkin error:", checkinError);
    return { success: false, error: "Failed to save checkin" };
  }

  // If this is an update, don't award more points
  if (isUpdate) {
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_count")
      .eq("user_id", userId)
      .eq("streak_type", "checkin")
      .single();

    return {
      success: true,
      pointsEarned: 0,
      newStreak: streak?.current_count || 0,
      milestone: null,
    };
  }

  // Calculate streak
  const { data: streakData } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("streak_type", "checkin")
    .single();

  let newStreak = 1;
  let longestStreak = streakData?.longest_count || 0;

  if (streakData?.last_checkin_date) {
    const lastCheckin = parseISO(streakData.last_checkin_date);
    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");
    const lastCheckinStr = format(lastCheckin, "yyyy-MM-dd");

    if (lastCheckinStr === yesterdayStr) {
      // Consecutive day
      newStreak = (streakData.current_count || 0) + 1;
    } else if (lastCheckinStr === today) {
      // Already checked in today (shouldn't happen due to isUpdate check)
      newStreak = streakData.current_count || 1;
    }
    // Otherwise streak resets to 1
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  // Update streak
  await supabase.from("streaks").upsert(
    {
      user_id: userId,
      streak_type: "checkin",
      current_count: newStreak,
      longest_count: longestStreak,
      last_checkin_date: today,
    },
    {
      onConflict: "user_id,streak_type",
    }
  );

  // Calculate points
  let totalPoints = POINTS.DAILY_CHECKIN;
  const streakBonus = getStreakBonus(newStreak);
  totalPoints += streakBonus;

  // Award points
  await supabase.from("point_transactions").insert({
    user_id: userId,
    amount: POINTS.DAILY_CHECKIN,
    transaction_type: "checkin",
    reason: "Daily check-in",
  });

  if (streakBonus > 0) {
    await supabase.from("point_transactions").insert({
      user_id: userId,
      amount: streakBonus,
      transaction_type: "streak_bonus",
      reason: `${newStreak} day streak bonus`,
    });
  }

  const milestone = getStreakMilestone(newStreak);

  return {
    success: true,
    pointsEarned: totalPoints,
    newStreak,
    milestone,
  };
}

export async function getTodayCheckinForUser(userId: string) {
  if (!userId) return null;

  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .single();

  return data;
}

export async function getCurrentStreakForUser(userId: string) {
  if (!userId) return 0;

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("streaks")
    .select("current_count")
    .eq("user_id", userId)
    .eq("streak_type", "checkin")
    .single();

  return data?.current_count || 0;
}
