import { checkCompanyAccess } from "@/lib/whop-auth";
import { getPendingRedemptions } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList, User } from "lucide-react";
import { RedemptionActionsAdmin } from "./redemption-actions";
import Image from "next/image";

export default async function AdminRedemptionsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { userId } = await checkCompanyAccess(companyId);

  if (!userId) return null;

  const redemptions = await getPendingRedemptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Pending Redemptions</h1>
        <p className="text-zinc-400">Fulfill or cancel pending reward redemptions.</p>
      </div>

      {redemptions.length > 0 ? (
        <div className="space-y-4">
          {redemptions.map((redemption) => {
            const user = redemption.user as {
              id: string;
              username: string | null;
              avatar_url: string | null;
            } | null;
            const reward = redemption.reward as {
              title: string;
              description: string | null;
              point_cost: number;
            } | null;

            return (
              <Card key={redemption.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user?.avatar_url ? (
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
                      <div>
                        <p className="font-medium text-white">
                          {user?.username || "Anonymous"}
                        </p>
                        <p className="text-sm text-zinc-400">
                          Requested: {reward?.title || "Unknown Reward"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {formatDistanceToNow(new Date(redemption.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="warning">Pending</Badge>
                      <RedemptionActionsAdmin redemptionId={redemption.id} />
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
            <ClipboardList className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No pending redemptions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
