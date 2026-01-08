import { checkExperienceAccess } from "@/lib/whop-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActivityItem } from "@/components/activity-item";
import { Card, CardContent } from "@/components/ui/card";

export default async function FeedPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);

  if (!userId) return null;

  const supabase = createAdminClient();

  const { data: checkins } = await supabase
    .from("checkins")
    .select(
      `
      id,
      checkin_date,
      mood,
      wins,
      struggles,
      focus,
      created_at,
      user:users(username, avatar_url)
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const activities = (checkins || []).map((checkin) => {
    const user = checkin.user as unknown as {
      username: string | null;
      avatar_url: string | null;
    } | null;
    return {
      id: checkin.id,
      user: {
        username: user?.username || null,
        avatar_url: user?.avatar_url || null,
      },
      checkin_date: checkin.checkin_date,
      mood: checkin.mood,
      wins: checkin.wins,
      struggles: checkin.struggles,
      focus: checkin.focus,
      created_at: checkin.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Community Feed</h1>
        <p className="text-zinc-400">
          See what others in the community are working on.
        </p>
      </div>

      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">
              No public check-ins yet. Be the first to share!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
