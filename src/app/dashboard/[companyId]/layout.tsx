import { checkCompanyAccess } from "@/lib/whop-auth";
import Link from "next/link";
import { LayoutDashboard, Gift, ClipboardList, Users, Target, Activity } from "lucide-react";

export default async function CompanyDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const { hasAccess, isAdmin, userId } = await checkCompanyAccess(companyId);

  if (!hasAccess || !isAdmin || !userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-zinc-400">
            You need admin access to view this dashboard.
          </p>
        </div>
      </div>
    );
  }

  const adminTabs = [
    { href: `/dashboard/${companyId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/dashboard/${companyId}/rewards`, label: "Rewards", icon: Gift },
    { href: `/dashboard/${companyId}/milestones`, label: "Milestones", icon: Target },
    { href: `/dashboard/${companyId}/redemptions`, label: "Redemptions", icon: ClipboardList },
    { href: `/dashboard/${companyId}/users`, label: "Users", icon: Users },
    { href: `/dashboard/${companyId}/activity`, label: "Activity", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-bold text-brand">
              TGFX Rewards Admin
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {adminTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-zinc-400 hover:text-white hover:bg-zinc-800 whitespace-nowrap"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
