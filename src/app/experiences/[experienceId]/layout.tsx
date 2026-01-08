import { checkExperienceAccess, syncUserToSupabase, getUserBalance } from "@/lib/whop-auth";
import { NavTabs } from "@/components/nav-tabs";
import { PointsDisplay } from "@/components/points-display";
import Link from "next/link";

export default async function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { hasAccess, userId } = await checkExperienceAccess(experienceId);

  if (!hasAccess || !userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400">
            You need an active membership to access this content.
          </p>
        </div>
      </div>
    );
  }

  await syncUserToSupabase(userId);
  const balance = await getUserBalance(userId);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/experiences/${experienceId}`}
              className="text-xl font-bold text-brand"
            >
              TGFX Rewards
            </Link>
            <PointsDisplay points={balance} />
          </div>
          <NavTabs experienceId={experienceId} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
