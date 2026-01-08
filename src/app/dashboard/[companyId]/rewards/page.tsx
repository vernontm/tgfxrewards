import { checkCompanyAccess } from "@/lib/whop-auth";
import { getAllRewards } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Gift } from "lucide-react";
import { RewardActionsAdmin } from "./reward-actions";

export default async function AdminRewardsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { userId } = await checkCompanyAccess(companyId);

  if (!userId) return null;

  const rewards = await getAllRewards();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manage Rewards</h1>
          <p className="text-zinc-400">Create and manage rewards for the shop.</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/${companyId}/rewards/new`}>
            <Plus className="w-4 h-4 mr-2" />
            New Reward
          </Link>
        </Button>
      </div>

      {rewards.length > 0 ? (
        <div className="space-y-4">
          {rewards.map((reward) => (
            <Card key={reward.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                      <Gift className="w-6 h-6 text-zinc-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{reward.title}</p>
                        <Badge variant={reward.is_active ? "success" : "secondary"}>
                          {reward.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {reward.point_cost.toLocaleString()} points
                        {reward.quantity !== null && (
                          <span>
                            {" "}| {reward.quantity - reward.claimed_count} / {reward.quantity} remaining
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <RewardActionsAdmin reward={reward} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 mb-4">No rewards created yet.</p>
            <Button asChild>
              <Link href={`/dashboard/${companyId}/rewards/new`}>Create First Reward</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
