import { headers } from "next/headers";
import { whopsdk } from "./whop-sdk";
import { createAdminClient } from "./supabase/admin";

export async function getWhopUser() {
  try {
    const headersList = await headers();
    const { userId } = await whopsdk.verifyUserToken(headersList);
    return userId;
  } catch (error) {
    console.error("Failed to verify user token:", error);
    return null;
  }
}

export async function checkExperienceAccess(experienceId: string) {
  const userId = await getWhopUser();
  if (!userId) return { hasAccess: false, userId: null, accessLevel: null };

  try {
    const access = await whopsdk.users.checkAccess(experienceId, { id: userId });
    return {
      hasAccess: access.has_access,
      userId,
      accessLevel: access.access_level,
    };
  } catch (error) {
    console.error("Failed to check access:", error);
    return { hasAccess: false, userId, accessLevel: null };
  }
}

export async function checkCompanyAccess(companyId: string) {
  const userId = await getWhopUser();
  if (!userId) return { hasAccess: false, userId: null, isAdmin: false };

  try {
    const access = await whopsdk.users.checkAccess(companyId, { id: userId });
    return {
      hasAccess: access.has_access,
      userId,
      isAdmin: access.access_level === "admin",
    };
  } catch (error) {
    console.error("Failed to check company access:", error);
    return { hasAccess: false, userId, isAdmin: false };
  }
}

export async function syncUserToSupabase(userId: string) {
  const supabase = createAdminClient();

  // Fetch user info from Whop
  let username: string | null = null;
  let avatarUrl: string | null = null;
  try {
    const whopUser = await whopsdk.users.retrieve(userId);
    username = whopUser.username || whopUser.name || null;
    avatarUrl = whopUser.profile_picture?.url || null;
  } catch (error) {
    console.error("Failed to fetch Whop user:", error);
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", userId)
    .single();

  if (!existingUser) {
    // Create new user
    await supabase.from("users").insert({
      id: userId,
      username,
      avatar_url: avatarUrl,
    });

    await supabase.from("streaks").insert({
      user_id: userId,
      current_count: 0,
      longest_count: 0,
    });
  } else if (!existingUser.username && username) {
    // Update existing user with username if they don't have one
    await supabase
      .from("users")
      .update({ username, avatar_url: avatarUrl })
      .eq("id", userId);
  }

  return userId;
}

export async function getUserBalance(userId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("get_user_balance", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error getting user balance:", error);
    return 0;
  }

  return data || 0;
}
