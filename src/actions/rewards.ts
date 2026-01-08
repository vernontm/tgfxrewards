"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUserBalance } from "@/lib/whop-auth";

export async function redeemRewardForUser(rewardId: string, userId: string) {
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get reward details
  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("is_active", true)
    .single();

  if (rewardError || !reward) {
    return { success: false, error: "Reward not found" };
  }

  // Check if sold out
  if (reward.quantity !== null && reward.claimed_count >= reward.quantity) {
    return { success: false, error: "Reward is sold out" };
  }

  // Check if expired
  if (reward.expires_at && new Date(reward.expires_at) < new Date()) {
    return { success: false, error: "Reward has expired" };
  }

  // Check user balance
  const balance = await getUserBalance(userId);
  if (balance < reward.point_cost) {
    return { success: false, error: "Insufficient points" };
  }

  // Deduct points
  const { error: pointsError } = await supabase
    .from("point_transactions")
    .insert({
      user_id: userId,
      amount: -reward.point_cost,
      transaction_type: "redemption",
      reason: `Redeemed: ${reward.title}`,
      metadata: { reward_id: rewardId },
    });

  if (pointsError) {
    console.error("Points deduction error:", pointsError);
    return { success: false, error: "Failed to process redemption" };
  }

  // Create redemption record
  const { error: redemptionError } = await supabase
    .from("redemptions")
    .insert({
      user_id: userId,
      reward_id: rewardId,
      status: "pending",
    });

  if (redemptionError) {
    console.error("Redemption error:", redemptionError);
    // Refund points
    await supabase.from("point_transactions").insert({
      user_id: userId,
      amount: reward.point_cost,
      transaction_type: "refund",
      reason: `Refund: Failed redemption of ${reward.title}`,
    });
    return { success: false, error: "Failed to create redemption" };
  }

  // Update claimed count
  await supabase
    .from("rewards")
    .update({ claimed_count: reward.claimed_count + 1 })
    .eq("id", rewardId);

  return { success: true };
}

export async function getActiveRewards() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }

  return data || [];
}

export async function getUserRedemptionsForUser(userId: string) {
  if (!userId) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("redemptions")
    .select(
      `
      *,
      reward:rewards(title, description, image_url)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching redemptions:", error);
    return [];
  }

  return data || [];
}
