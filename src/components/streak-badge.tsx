import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  count: number;
  className?: string;
  showLabel?: boolean;
}

export function StreakBadge({
  count,
  className,
  showLabel = true,
}: StreakBadgeProps) {
  const getStreakColor = () => {
    if (count >= 100) return "text-purple-500 bg-purple-500/20";
    if (count >= 30) return "text-amber-500 bg-amber-500/20";
    if (count >= 7) return "text-orange-500 bg-orange-500/20";
    return "text-zinc-400 bg-zinc-700";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm",
        getStreakColor(),
        className
      )}
    >
      <Flame className="w-4 h-4" />
      <span>{count}</span>
      {showLabel && <span className="text-xs opacity-75">day streak</span>}
    </div>
  );
}
