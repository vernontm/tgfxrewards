"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  CheckCircle,
  Trophy,
  Users,
  Gift,
  MessageSquare,
} from "lucide-react";

interface NavTabsProps {
  experienceId?: string;
}

export function NavTabs({ experienceId }: NavTabsProps) {
  const pathname = usePathname();
  
  const baseUrl = experienceId ? `/experiences/${experienceId}` : "/dashboard";
  
  const tabs = [
    { href: baseUrl, label: "Home", icon: Home },
    { href: `${baseUrl}/checkin`, label: "Check In", icon: CheckCircle },
    { href: `${baseUrl}/leaderboard`, label: "Leaderboard", icon: Trophy },
    { href: `${baseUrl}/partners`, label: "Partners", icon: Users },
    { href: `${baseUrl}/rewards`, label: "Rewards", icon: Gift },
    { href: `${baseUrl}/feed`, label: "Feed", icon: MessageSquare },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== baseUrl && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-brand text-black"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
