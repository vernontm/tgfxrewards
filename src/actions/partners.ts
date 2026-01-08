"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getWhopUser } from "@/lib/whop-auth";

export async function sendPartnerRequestForUser(senderId: string, receiverId: string) {
  if (!senderId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  if (senderId === receiverId) {
    return { success: false, error: "Cannot partner with yourself" };
  }

  // Check if partnership already exists
  const { data: existing } = await supabase
    .from("partnerships")
    .select("id, status")
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .single();

  if (existing) {
    if (existing.status === "active") {
      return { success: false, error: "Already partners" };
    }
    if (existing.status === "pending") {
      return { success: false, error: "Request already pending" };
    }
  }

  const { error } = await supabase.from("partnerships").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: "pending",
  });

  if (error) {
    console.error("Partnership request error:", error);
    return { success: false, error: "Failed to send request" };
  }

  revalidatePath("/dashboard/partners");
  return { success: true };
}

export async function acceptPartnerRequest(partnershipId: string, userId?: string) {
  const currentUserId = userId || await getWhopUser();
  
  if (!currentUserId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Verify the user is the receiver
  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .eq("id", partnershipId)
    .eq("receiver_id", currentUserId)
    .eq("status", "pending")
    .single();

  if (!partnership) {
    return { success: false, error: "Partnership request not found" };
  }

  const { error } = await supabase
    .from("partnerships")
    .update({ status: "active" })
    .eq("id", partnershipId);

  if (error) {
    console.error("Accept partnership error:", error);
    return { success: false, error: "Failed to accept request" };
  }

  revalidatePath("/dashboard/partners");
  return { success: true };
}

export async function endPartnership(partnershipId: string, userId?: string) {
  const currentUserId = userId || await getWhopUser();
  
  if (!currentUserId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Verify the user is part of this partnership
  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .eq("id", partnershipId)
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .single();

  if (!partnership) {
    return { success: false, error: "Partnership not found" };
  }

  const { error } = await supabase
    .from("partnerships")
    .update({ status: "ended" })
    .eq("id", partnershipId);

  if (error) {
    console.error("End partnership error:", error);
    return { success: false, error: "Failed to end partnership" };
  }

  revalidatePath("/dashboard/partners");
  return { success: true };
}

export async function getPartnersForUser(userId?: string) {
  const currentUserId = userId || await getWhopUser();
  
  if (!currentUserId) {
    return { active: [], pending_incoming: [], pending_outgoing: [], userId: null };
  }

  const supabase = createAdminClient();

  // Get all partnerships involving the user
  const { data: partnerships } = await supabase
    .from("partnerships")
    .select(
      `
      id,
      status,
      sender_id,
      receiver_id,
      sender:users!partnerships_sender_id_fkey(id, username, avatar_url),
      receiver:users!partnerships_receiver_id_fkey(id, username, avatar_url)
    `
    )
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .neq("status", "ended");

  if (!partnerships) {
    return { active: [], pending_incoming: [], pending_outgoing: [], userId: currentUserId };
  }

  const active: Array<{
    partnershipId: string;
    partner: { id: string; username: string | null; avatar_url: string | null };
  }> = [];
  const pending_incoming: typeof active = [];
  const pending_outgoing: typeof active = [];

  for (const p of partnerships) {
    const isReceiver = p.receiver_id === currentUserId;
    const partner = isReceiver ? p.sender : p.receiver;

    if (!partner || typeof partner !== "object" || !("id" in partner)) continue;

    const partnerObj = partner as unknown as { id: string; username: string | null; avatar_url: string | null };
    const partnerData = {
      partnershipId: p.id,
      partner: {
        id: partnerObj.id,
        username: partnerObj.username,
        avatar_url: partnerObj.avatar_url,
      },
    };

    if (p.status === "active") {
      active.push(partnerData);
    } else if (p.status === "pending") {
      if (isReceiver) {
        pending_incoming.push(partnerData);
      } else {
        pending_outgoing.push(partnerData);
      }
    }
  }

  return { active, pending_incoming, pending_outgoing, userId: currentUserId };
}

export async function searchUsers(query: string, excludeUserId?: string) {
  const currentUserId = excludeUserId || await getWhopUser();
  
  if (!currentUserId) {
    return [];
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .neq("id", currentUserId)
    .ilike("username", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("Search users error:", error);
    return [];
  }

  return data || [];
}

// Get all community members who are seeking partners (have a profile)
export async function getAllCommunityMembers(excludeUserId?: string) {
  const currentUserId = excludeUserId || await getWhopUser();
  
  const supabase = createAdminClient();

  let query = supabase
    .from("users")
    .select(`
      id, 
      username, 
      avatar_url,
      streaks(current_count, longest_count),
      partner_profiles(
        is_seeking_partner,
        trading_experience,
        years_trading,
        trading_style,
        strengths,
        weaknesses,
        goals,
        availability,
        timezone,
        gender,
        age_range,
        bio
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (currentUserId) {
    query = query.neq("id", currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Get community members error:", error);
    return [];
  }

  return data || [];
}

// Get users who are actively seeking partners
export async function getSeekingPartners(excludeUserId?: string) {
  const currentUserId = excludeUserId || await getWhopUser();
  
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("partner_profiles")
    .select(`
      *,
      users(id, username, avatar_url, streaks(current_count, longest_count))
    `)
    .eq("is_seeking_partner", true)
    .neq("user_id", currentUserId || "")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Get seeking partners error:", error);
    return [];
  }

  return data || [];
}

// Get current user's partner profile
export async function getMyPartnerProfile() {
  const userId = await getWhopUser();
  if (!userId) return null;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("partner_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Get partner profile error:", error);
  }

  return { profile: data, userId };
}

// Create or update partner profile
export interface PartnerProfileData {
  is_seeking_partner: boolean;
  trading_experience: string;
  years_trading: number | null;
  trading_style: string | null;
  strengths: string | null;
  weaknesses: string | null;
  goals: string | null;
  availability: string | null;
  timezone: string | null;
  gender: string | null;
  age_range: string | null;
  bio: string | null;
}

export async function savePartnerProfile(data: PartnerProfileData) {
  const userId = await getWhopUser();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("partner_profiles")
    .upsert(
      {
        user_id: userId,
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Save partner profile error:", error);
    return { success: false, error: "Failed to save profile" };
  }

  revalidatePath("/experiences");
  return { success: true };
}
