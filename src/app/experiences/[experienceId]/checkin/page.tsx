import { checkExperienceAccess } from "@/lib/whop-auth";
import { getTodayCheckinForUser, getCurrentStreakForUser } from "@/actions/checkin";
import { CheckinForm } from "@/components/checkin-form";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);

  if (!userId) return null;

  const [existingCheckin, currentStreak] = await Promise.all([
    getTodayCheckinForUser(userId),
    getCurrentStreakForUser(userId),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Daily Check-in</h1>
        <p className="text-zinc-400">
          Reflect on your day and track your progress.
        </p>
      </div>

      <CheckinForm
        existingCheckin={existingCheckin}
        currentStreak={currentStreak}
        userId={userId}
      />
    </div>
  );
}
