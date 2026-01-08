import { checkCompanyAccess } from "@/lib/whop-auth";
import { getActivityFeedAdmin } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Activity, CheckCircle, Target, Gift, Flame, Users, GraduationCap } from "lucide-react";

const activityIcons: Record<string, React.ElementType> = {
  checkin: CheckCircle,
  milestone: Target,
  reward_claim: Gift,
  streak: Flame,
  partner_connect: Users,
  course_progress: GraduationCap,
};

export default async function AdminActivityPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { isAdmin } = await checkCompanyAccess(companyId);

  if (!isAdmin) return null;

  const activities = await getActivityFeedAdmin(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Activity Log</h1>
        <p className="text-zinc-400">
          View all user activity across the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.activity_type] || CheckCircle;
                const user = activity.users as { username?: string; avatar_url?: string } | null;
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-xl">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.username || "User"}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-brand" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">
                          {user?.username || "Anonymous"}
                        </span>
                        <span className="text-zinc-500 text-xs">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-zinc-300 text-sm">
                        {activity.title}
                      </p>
                      
                      {activity.points_earned > 0 && (
                        <span className="text-xs text-brand">
                          +{activity.points_earned} points
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-1 rounded">
                      {activity.activity_type}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No activity yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
