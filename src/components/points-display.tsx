import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  points: number;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function PointsDisplay({
  points,
  className,
  size = "default",
}: PointsDisplayProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 bg-brand/20 text-brand rounded-full font-semibold",
        {
          "px-2 py-1 text-xs": size === "sm",
          "px-3 py-1.5 text-sm": size === "default",
          "px-4 py-2 text-base": size === "lg",
        },
        className
      )}
    >
      <Coins
        className={cn({
          "w-3 h-3": size === "sm",
          "w-4 h-4": size === "default",
          "w-5 h-5": size === "lg",
        })}
      />
      <span>{points.toLocaleString()}</span>
    </div>
  );
}
