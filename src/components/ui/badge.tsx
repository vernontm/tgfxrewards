import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-amber-500/20 text-amber-500": variant === "default",
          "bg-zinc-700 text-zinc-300": variant === "secondary",
          "bg-green-500/20 text-green-500": variant === "success",
          "bg-yellow-500/20 text-yellow-500": variant === "warning",
          "bg-red-500/20 text-red-500": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
