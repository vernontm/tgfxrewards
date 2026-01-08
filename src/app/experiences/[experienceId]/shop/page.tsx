import { checkExperienceAccess, getUserBalance } from "@/lib/whop-auth";
import { getActiveRewards, getUserRedemptionsForUser } from "@/actions/rewards";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PointsDisplay } from "@/components/points-display";
import { formatDistanceToNow } from "date-fns";
import { Gift, Lock, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { ShopRewardCard } from "@/components/shop-reward-card";

export default async function ShopPage({
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
            <ShopRewardCard
              key={reward.id}
              reward={reward}
              userBalance={balance}
              userId={userId}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Coming Soon!</h3>
            <p className="text-zinc-400 max-w-md mx-auto">
              Exciting rewards are being added to the shop. Keep earning points and check back soon!
            </p>
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
