import { checkCompanyAccess } from "@/lib/whop-auth";
import { getAllUsers } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StreakBadge } from "@/components/streak-badge";
import { PointsDisplay } from "@/components/points-display";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { User, Users } from "lucide-react";
import { GrantPointsButtonAdmin } from "./grant-points-button";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { userId } = await checkCompanyAccess(companyId);

  if (!userId) return null;

  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Manage Users</h1>
        <p className="text-zinc-400">View user stats and grant bonus points.</p>
      </div>

      {users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => {
            const streak = user.streak as
              | { current_count: number; longest_count: number }[]
              | null;
            const currentStreak = streak?.[0]?.current_count || 0;

            return (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.username || "User"}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {user.username || "Anonymous"}
                          </p>
                          {user.is_admin && <Badge variant="default">Admin</Badge>}
                        </div>
                        <p className="text-xs text-zinc-500">
                          Joined{" "}
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <PointsDisplay points={user.balance} size="sm" />
                        <StreakBadge
                          count={currentStreak}
                          showLabel={false}
                          className="mt-1"
                        />
                      </div>
                      <GrantPointsButtonAdmin userId={user.id} />
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
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No users yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
