"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { POINTS, getStreakBonus, getStreakMilestone } from "@/lib/points";
import { format, subDays, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";

// Quick check-in (just logs the check-in, no survey data yet)
export async function quickCheckin(userId: string) {
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Check if user already checked in today
  const { data: existingCheckin } = await supabase
    .from("checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .single();

  if (existingCheckin) {
    // Already checked in today
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_count")
      .eq("user_id", userId)
      .single();

    return {
      success: true,
      checkinId: existingCheckin.id,
      pointsEarned: 0,
      newStreak: streak?.current_count || 0,
      milestone: null,
      alreadyCheckedIn: true,
    };
  }

  // Create new checkin
  const { data: newCheckin, error: checkinError } = await supabase
    .from("checkins")
    .insert({
      user_id: userId,
      checkin_date: today,
    })
    .select("id")
    .single();

  if (checkinError) {
    console.error("Checkin error:", checkinError);
    return { success: false, error: "Failed to save checkin" };
  }

  // Calculate streak
  const { data: streakData } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  let newStreak = 1;
  let longestStreak = streakData?.longest_count || 0;

  if (streakData?.last_checkin_date) {
    const lastCheckin = parseISO(streakData.last_checkin_date);
    const yesterday = subDays(new Date(), 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");
    const lastCheckinStr = format(lastCheckin, "yyyy-MM-dd");

    if (lastCheckinStr === yesterdayStr) {
      newStreak = (streakData.current_count || 0) + 1;
    } else if (lastCheckinStr === today) {
      newStreak = streakData.current_count || 1;
    }
  }

  if (newStreak > longestStreak) {
    longestStreak = newStreak;
  }

  // Update or create streak
  await supabase.from("streaks").upsert(
    {
      user_id: userId,
      current_count: newStreak,
      longest_count: longestStreak,
      last_checkin_date: today,
    },
    {
      onConflict: "user_id",
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

  revalidatePath("/experiences");

  return {
    success: true,
    checkinId: newCheckin.id,
    pointsEarned: totalPoints,
    newStreak,
    milestone,
    alreadyCheckedIn: false,
  };
}

// Update checkin with survey data
export async function updateCheckinSurvey(
  checkinId: string,
  data: {
    mood: number | null;
    wins: string | null;
    struggles: string | null;
    focus: string | null;
  }
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("checkins")
    .update({
      mood: data.mood,
      wins: data.wins,
      struggles: data.struggles,
      focus: data.focus,
    })
    .eq("id", checkinId);

  if (error) {
    console.error("Update checkin error:", error);
    return { success: false, error: "Failed to update checkin" };
  }

  revalidatePath("/experiences");
  return { success: true };
}

export async function getTodayCheckinForUser(userId: string) {
  if (!userId) return null;

  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data } = await supabase
    .from("checkins")
    .select("id, mood, wins, struggles, focus")
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
    .single();

  return data?.current_count || 0;
}
