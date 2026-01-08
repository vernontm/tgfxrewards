import { checkExperienceAccess, getUserBalance } from "@/lib/whop-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreakBadge } from "@/components/streak-badge";
import { PointsDisplay } from "@/components/points-display";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle, Flame, Trophy, ArrowRight } from "lucide-react";

export default async function ExperienceHomePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);
  
  if (!userId) return null;

  const supabase = createAdminClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { data: todayCheckin },
    { data: streak },
    { data: leaderboard },
    balance,
  ] = await Promise.all([
    supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .single(),
    supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("streak_type", "checkin")
      .single(),
    supabase.rpc("get_streak_leaderboard", { limit_count: 5 }),
    getUserBalance(userId),
  ]);

  const hasCheckedInToday = !!todayCheckin;
  const currentStreak = streak?.current_count || 0;
  const longestStreak = streak?.longest_count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back!</h1>
        <p className="text-zinc-400">
          {hasCheckedInToday
            ? "You've already checked in today. Keep up the great work!"
            : "Don't forget to check in today to maintain your streak."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Today&apos;s Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasCheckedInToday ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl text-green-500">Done</span>
              </div>
            ) : (
              <Button asChild>
                <Link href={`/experiences/${experienceId}/checkin`}>
                  Check In Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StreakBadge count={currentStreak} showLabel={false} />
            <p className="text-xs text-zinc-500 mt-2">
              Longest: {longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Points Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PointsDisplay points={balance} size="lg" />
            <Link
              href={`/experiences/${experienceId}/rewards`}
              className="text-xs text-amber-500 hover:underline mt-2 inline-block"
            >
              View Rewards Shop
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top Streaks</span>
              <Link
                href={`/experiences/${experienceId}/leaderboard`}
                className="text-sm text-amber-500 hover:underline font-normal"
              >
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard && leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map(
                  (
                    user: {
                      user_id: string;
                      username: string | null;
                      current_count: number;
                    },
                    index: number
                  ) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                              ? "bg-amber-500 text-black"
                              : index === 1
                              ? "bg-zinc-400 text-black"
                              : index === 2
                              ? "bg-amber-700 text-white"
                              : "bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-white">
                          {user.username || "Anonymous"}
                        </span>
                      </div>
                      <StreakBadge count={user.current_count} showLabel={false} />
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No streaks yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/experiences/${experienceId}/checkin`}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Daily Check-in
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/experiences/${experienceId}/partners`}>
                <Flame className="w-4 h-4 mr-2" />
                Find Partners
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/experiences/${experienceId}/feed`}>
                <Trophy className="w-4 h-4 mr-2" />
                Community Feed
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
