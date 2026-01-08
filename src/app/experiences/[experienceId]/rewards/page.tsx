import { checkExperienceAccess, getUserBalance } from "@/lib/whop-auth";
import { getActiveRewards, getUserRedemptionsForUser } from "@/actions/rewards";
import { RewardCard } from "@/components/reward-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PointsDisplay } from "@/components/points-display";
import { formatDistanceToNow } from "date-fns";

export default async function RewardsPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);

  if (!userId) return null;

  const [rewards, redemptions, balance] = await Promise.all([
    getActiveRewards(),
    getUserRedemptionsForUser(userId),
    getUserBalance(userId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Rewards Shop</h1>
          <p className="text-zinc-400">
            Redeem your points for exclusive rewards.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-400 mb-1">Your Balance</p>
          <PointsDisplay points={balance} size="lg" />
        </div>
      </div>

      {rewards.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userBalance={balance}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">No rewards available at the moment.</p>
          </CardContent>
        </Card>
      )}

      {redemptions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Redemptions</h2>
          <div className="space-y-3">
            {redemptions.map((redemption) => {
              const reward = redemption.reward as {
                title: string;
                description: string | null;
              } | null;
              return (
                <Card key={redemption.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {reward?.title || "Unknown Reward"}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {formatDistanceToNow(new Date(redemption.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          redemption.status === "fulfilled"
                            ? "success"
                            : redemption.status === "cancelled"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {redemption.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
