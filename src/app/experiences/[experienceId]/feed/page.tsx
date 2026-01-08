import { checkExperienceAccess } from "@/lib/whop-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { 
  CheckCircle, 
  Target, 
  Gift, 
  Flame, 
  Users, 
  GraduationCap,
  UserPlus
} from "lucide-react";

const activityIcons: Record<string, React.ElementType> = {
  checkin: CheckCircle,
  milestone: Target,
  reward_claim: Gift,
  streak: Flame,
  partner_connect: Users,
  course_progress: GraduationCap,
  introduction: UserPlus,
};

export default async function FeedPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);

  if (!userId) return null;

  const supabase = createAdminClient();

  // Get activity feed
  const { data: activities } = await supabase
    .from("activity_feed")
    .select(`
      *,
      users(id, username, avatar_url)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  // Also get recent check-ins for backwards compatibility
  const { data: checkins } = await supabase
    .from("checkins")
    .select(`
      id,
      checkin_date,
      mood,
      wins,
      focus,
      points_earned,
      created_at,
      users(id, username, avatar_url)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(20);

  // Combine and sort all activities
  const allActivities = [
    ...(activities || []).map(a => ({
      id: a.id,
      type: a.activity_type,
      title: a.title,
      description: a.description,
      points: a.points_earned,
      user: a.users,
      created_at: a.created_at,
    })),
    ...(checkins || []).map(c => ({
      id: `checkin-${c.id}`,
      type: "checkin",
      title: "Daily Check-in",
      description: c.focus || c.wins || null,
      points: c.points_earned,
      user: c.users,
      created_at: c.created_at,
      mood: c.mood,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
   .slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Activity Feed</h1>
        <p className="text-zinc-400">
          See what&apos;s happening in the TGFX community.
        </p>
      </div>

      {allActivities.length > 0 ? (
        <div className="space-y-3">
          {allActivities.map((activity) => {
            const Icon = activityIcons[activity.type] || CheckCircle;
            const user = activity.user as { username?: string; avatar_url?: string } | null;
            
            return (
              <Card key={activity.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-brand" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {user?.username || "Anonymous"}
                        </span>
                        <span className="text-zinc-500 text-sm">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-zinc-300 text-sm mt-1">
                        {activity.title}
                      </p>
                      
                      {activity.description && (
                        <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      
                      {activity.points > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand mt-2">
                          +{activity.points} points
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">
              No activity yet. Check in to be the first!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
