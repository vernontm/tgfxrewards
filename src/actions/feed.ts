"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getWhopUser } from "@/lib/whop-auth";

export async function getActivityFeed(limit: number = 50) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activity_feed")
    .select(`
      *,
      users(id, username, avatar_url)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Get activity feed error:", error);
    return [];
  }

  return data || [];
}

export async function getMyActivity(limit: number = 20) {
  const userId = await getWhopUser();
  if (!userId) return [];

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Get my activity error:", error);
    return [];
  }

  return data || [];
}

export async function addActivity(
  activityType: string,
  title: string,
  description?: string,
  pointsEarned?: number,
  metadata?: Record<string, unknown>,
  isPublic: boolean = true
) {
  const userId = await getWhopUser();
  if (!userId) return { success: false };

  const supabase = createAdminClient();

  const { error } = await supabase.from("activity_feed").insert({
    user_id: userId,
    activity_type: activityType,
    title,
    description,
    points_earned: pointsEarned || 0,
    metadata,
    is_public: isPublic,
  });

  if (error) {
    console.error("Add activity error:", error);
    return { success: false };
  }

  return { success: true };
}
