import { checkExperienceAccess } from "@/lib/whop-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakBadge } from "@/components/streak-badge";
import Image from "next/image";
import { User, Crown, Medal, Award } from "lucide-react";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);

  if (!userId) return null;

  const supabase = createAdminClient();

  const { data: leaderboard } = await supabase.rpc("get_streak_leaderboard", {
    limit_count: 50,
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-amber-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-zinc-400" />;
    if (index === 2) return <Award className="w-5 h-5 text-amber-700" />;
    return null;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return "bg-amber-500/10 border-amber-500/30";
    if (index === 1) return "bg-zinc-400/10 border-zinc-400/30";
    if (index === 2) return "bg-amber-700/10 border-amber-700/30";
    return "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-zinc-400">
          See who has the longest streaks in the community.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Streak Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map(
                (
                  user: {
                    user_id: string;
                    username: string | null;
                    avatar_url: string | null;
                    current_count: number;
                    longest_count: number;
                  },
                  index: number
                ) => {
                  const isCurrentUser = user.user_id === userId;
                  return (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${
                        isCurrentUser
                          ? "bg-amber-500/5 border-amber-500/20"
                          : getRankStyle(index) || "border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(index) || (
                          <span className="text-zinc-500 font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username || "User"}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {user.username || "Anonymous"}
                          {isCurrentUser && (
                            <span className="text-amber-500 ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Best: {user.longest_count} days
                        </p>
                      </div>

                      <StreakBadge count={user.current_count} />
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No streaks yet. Be the first to start one!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
