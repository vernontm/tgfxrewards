"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createReward(data: {
  title: string;
  description?: string;
  image_url?: string;
  point_cost: number;
  quantity?: number;
  expires_at?: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("rewards").insert({
    title: data.title,
    description: data.description || null,
    image_url: data.image_url || null,
    point_cost: data.point_cost,
    quantity: data.quantity || null,
    expires_at: data.expires_at || null,
    is_active: true,
  });

  if (error) {
    console.error("Create reward error:", error);
    return { success: false, error: "Failed to create reward" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateReward(
  rewardId: string,
  data: {
    title?: string;
    description?: string;
    image_url?: string;
    point_cost?: number;
    quantity?: number;
    is_active?: boolean;
    expires_at?: string;
  }
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("rewards")
    .update(data)
    .eq("id", rewardId);

  if (error) {
    console.error("Update reward error:", error);
    return { success: false, error: "Failed to update reward" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteReward(rewardId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("rewards").delete().eq("id", rewardId);

  if (error) {
    console.error("Delete reward error:", error);
    return { success: false, error: "Failed to delete reward" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function fulfillRedemption(redemptionId: string, notes?: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("redemptions")
    .update({
      status: "fulfilled",
      admin_notes: notes || null,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", redemptionId);

  if (error) {
    console.error("Fulfill redemption error:", error);
    return { success: false, error: "Failed to fulfill redemption" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function cancelRedemption(redemptionId: string, notes?: string) {
  const supabase = createAdminClient();

  const { data: redemption } = await supabase
    .from("redemptions")
    .select(`*, reward:rewards(title, point_cost)`)
    .eq("id", redemptionId)
    .single();

  if (!redemption) {
    return { success: false, error: "Redemption not found" };
  }

  const { error: updateError } = await supabase
    .from("redemptions")
    .update({ status: "cancelled", admin_notes: notes || null })
    .eq("id", redemptionId);

  if (updateError) {
    console.error("Cancel redemption error:", updateError);
    return { success: false, error: "Failed to cancel redemption" };
  }

  const reward = redemption.reward as { title: string; point_cost: number };
  await supabase.from("point_transactions").insert({
    user_id: redemption.user_id,
    amount: reward.point_cost,
    transaction_type: "refund",
    reason: `Refund: Cancelled redemption of ${reward.title}`,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function grantPoints(userId: string, amount: number, reason: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("point_transactions").insert({
    user_id: userId,
    amount,
    transaction_type: "admin_grant",
    reason,
  });

  if (error) {
    console.error("Grant points error:", error);
    return { success: false, error: "Failed to grant points" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPendingRedemptions() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("redemptions")
    .select(`*, user:users(id, username, avatar_url), reward:rewards(title, description, point_cost)`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get pending redemptions error:", error);
    return [];
  }

  return data || [];
}

export async function getAllUsers() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select(`*, streak:streaks(current_count, longest_count)`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get all users error:", error);
    return [];
  }

  const usersWithBalances = await Promise.all(
    (data || []).map(async (user) => {
      const { data: balance } = await supabase.rpc("get_user_balance", {
        p_user_id: user.id,
      });
      return { ...user, balance: balance || 0 };
    })
  );

  return usersWithBalances;
}

export async function getAllRewards() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get all rewards error:", error);
    return [];
  }

  return data || [];
}

// Milestone admin functions
export async function getAllMilestones() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Get all milestones error:", error);
    return [];
  }

  return data || [];
}

export async function createMilestone(data: {
  title: string;
  description?: string;
  points: number;
  milestone_type: string;
  requirement_value?: number;
  icon?: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("milestones").insert({
    title: data.title,
    description: data.description || null,
    points: data.points,
    milestone_type: data.milestone_type,
    requirement_value: data.requirement_value || 1,
    icon: data.icon || null,
    is_active: true,
  });

  if (error) {
    console.error("Create milestone error:", error);
    return { success: false, error: "Failed to create milestone" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMilestone(
  milestoneId: string,
  data: {
    title?: string;
    description?: string;
    points?: number;
    milestone_type?: string;
    requirement_value?: number;
    icon?: string;
    is_active?: boolean;
    sort_order?: number;
  }
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("milestones")
    .update(data)
    .eq("id", milestoneId);

  if (error) {
    console.error("Update milestone error:", error);
    return { success: false, error: "Failed to update milestone" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMilestone(milestoneId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("milestones").delete().eq("id", milestoneId);

  if (error) {
    console.error("Delete milestone error:", error);
    return { success: false, error: "Failed to delete milestone" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPendingMilestones() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_milestones")
    .select(`
      *,
      users(id, username, avatar_url),
      milestones(title, description, points, milestone_type)
    `)
    .is("verified_by", null)
    .order("completed_at", { ascending: true });

  if (error) {
    console.error("Get pending milestones error:", error);
    return [];
  }

  return data || [];
}

export async function approveMilestone(userMilestoneId: string, adminId: string) {
  const supabase = createAdminClient();

  // Get the milestone details
  const { data: userMilestone } = await supabase
    .from("user_milestones")
    .select(`*, milestones(title, points)`)
    .eq("id", userMilestoneId)
    .single();

  if (!userMilestone) {
    return { success: false, error: "Milestone not found" };
  }

  // Update verified_by
  const { error: updateError } = await supabase
    .from("user_milestones")
    .update({ verified_by: adminId })
    .eq("id", userMilestoneId);

  if (updateError) {
    console.error("Approve milestone error:", updateError);
    return { success: false, error: "Failed to approve milestone" };
  }

  const milestone = userMilestone.milestones as { title: string; points: number };

  // Award points
  await supabase.from("point_transactions").insert({
    user_id: userMilestone.user_id,
    amount: milestone.points,
    transaction_type: "admin_grant",
    reason: `Milestone: ${milestone.title}`,
  });

  // Add to activity feed
  await supabase.from("activity_feed").insert({
    user_id: userMilestone.user_id,
    activity_type: "milestone",
    title: `Completed: ${milestone.title}`,
    points_earned: milestone.points,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectMilestone(userMilestoneId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("user_milestones")
    .delete()
    .eq("id", userMilestoneId);

  if (error) {
    console.error("Reject milestone error:", error);
    return { success: false, error: "Failed to reject milestone" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getActivityFeedAdmin(limit: number = 100) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activity_feed")
    .select(`*, users(id, username, avatar_url)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Get activity feed error:", error);
    return [];
  }

  return data || [];
}
