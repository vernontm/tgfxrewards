import { checkCompanyAccess } from "@/lib/whop-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gift, ClipboardList, Flame } from "lucide-react";
import Link from "next/link";

export default async function CompanyDashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { userId } = await checkCompanyAccess(companyId);

  if (!userId) return null;

  const supabase = createAdminClient();

  const [
    { count: usersCount },
    { count: rewardsCount },
    { count: pendingRedemptionsCount },
    { count: checkinsToday },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("rewards")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("redemptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("checkin_date", new Date().toISOString().split("T")[0]),
  ]);

  const stats = [
    {
      label: "Total Users",
      value: usersCount || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Rewards",
      value: rewardsCount || 0,
      icon: Gift,
      color: "text-brand",
    },
    {
      label: "Pending Redemptions",
      value: pendingRedemptionsCount || 0,
      icon: ClipboardList,
      color: "text-purple-500",
    },
    {
      label: "Check-ins Today",
      value: checkinsToday || 0,
      icon: Flame,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Overview</h1>
        <p className="text-zinc-400">Manage your community and rewards.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-zinc-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-zinc-400">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href={`/dashboard/${companyId}/rewards/new`}
              className="block p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <p className="font-medium text-white">Create New Reward</p>
              <p className="text-sm text-zinc-400">Add a new reward to the shop</p>
            </Link>
            <Link
              href={`/dashboard/${companyId}/redemptions`}
              className="block p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <p className="font-medium text-white">Process Redemptions</p>
              <p className="text-sm text-zinc-400">
                {pendingRedemptionsCount || 0} pending redemptions
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-500 text-sm">
              {checkinsToday || 0} members checked in today
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
