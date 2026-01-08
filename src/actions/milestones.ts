"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWhopUser } from "@/lib/whop-auth";
import { revalidatePath } from "next/cache";

export async function getMilestones() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Get milestones error:", error);
    return [];
  }

  return data || [];
}

export async function getUserMilestones(userId?: string) {
  const currentUserId = userId || await getWhopUser();
  if (!currentUserId) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_milestones")
    .select("*, milestones(*)")
    .eq("user_id", currentUserId);

  if (error) {
    console.error("Get user milestones error:", error);
    return [];
  }

  return data || [];
}

export async function getMilestonesWithStatus() {
  const userId = await getWhopUser();
  if (!userId) return { milestones: [], completedIds: new Set<string>() };

  const supabase = createAdminClient();

  const [milestonesResult, userMilestonesResult, streakResult] = await Promise.all([
    supabase
      .from("milestones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_milestones")
      .select("milestone_id")
      .eq("user_id", userId),
    supabase
      .from("streaks")
      .select("current_count, longest_count")
      .eq("user_id", userId)
      .single(),
  ]);

  const milestones = milestonesResult.data || [];
  const completedIds = new Set(
    (userMilestonesResult.data || []).map((um: { milestone_id: string }) => um.milestone_id)
  );
  const streak = streakResult.data;

  return { milestones, completedIds, streak, userId };
}

export async function claimMilestone(milestoneId: string) {
  const userId = await getWhopUser();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Check if already claimed
  const { data: existing } = await supabase
    .from("user_milestones")
    .select("id")
    .eq("user_id", userId)
    .eq("milestone_id", milestoneId)
    .single();

  if (existing) {
    return { success: false, error: "Already claimed" };
  }

  // Get milestone details
  const { data: milestone } = await supabase
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .single();

  if (!milestone) {
    return { success: false, error: "Milestone not found" };
  }

  // For streak milestones, verify the streak
  if (milestone.milestone_type === "checkin_streak") {
    const { data: streak } = await supabase
      .from("streaks")
      .select("current_count, longest_count")
      .eq("user_id", userId)
      .single();

    const maxStreak = Math.max(streak?.current_count || 0, streak?.longest_count || 0);
    if (maxStreak < milestone.requirement_value) {
      return { success: false, error: `You need a ${milestone.requirement_value} day streak to claim this` };
    }
  }

  // Create user milestone record
  const { error: claimError } = await supabase
    .from("user_milestones")
    .insert({
      user_id: userId,
      milestone_id: milestoneId,
    });

  if (claimError) {
    console.error("Claim milestone error:", claimError);
    return { success: false, error: "Failed to claim milestone" };
  }

  // Award points
  await supabase.from("point_transactions").insert({
    user_id: userId,
    amount: milestone.points,
    transaction_type: "admin_grant",
    reason: `Milestone: ${milestone.title}`,
  });

  // Add to activity feed
  await supabase.from("activity_feed").insert({
    user_id: userId,
    activity_type: "milestone",
    title: `Completed: ${milestone.title}`,
    description: milestone.description,
    points_earned: milestone.points,
    metadata: { milestone_id: milestoneId },
  });

  revalidatePath("/experiences");
  return { success: true, points: milestone.points };
}

export async function submitMilestoneForReview(milestoneId: string, proof?: string) {
  const userId = await getWhopUser();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Check if already claimed
  const { data: existing } = await supabase
    .from("user_milestones")
    .select("id")
    .eq("user_id", userId)
    .eq("milestone_id", milestoneId)
    .single();

  if (existing) {
    return { success: false, error: "Already submitted" };
  }

  // Create pending milestone (verified_by will be null until admin approves)
  const { error } = await supabase
    .from("user_milestones")
    .insert({
      user_id: userId,
      milestone_id: milestoneId,
      notes: proof,
      verified_by: null, // Pending verification
    });

  if (error) {
    console.error("Submit milestone error:", error);
    return { success: false, error: "Failed to submit" };
  }

  revalidatePath("/experiences");
  return { success: true };
}
