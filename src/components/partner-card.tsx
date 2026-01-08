"use client";

import { useTransition } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StreakBadge } from "./streak-badge";
import { acceptPartnerRequest, endPartnership } from "@/actions/partners";
import { User, UserPlus, UserMinus, Check, X } from "lucide-react";

interface PartnerCardProps {
  partner: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    streak?: number;
  };
  partnershipId?: string;
  status: "active" | "pending_incoming" | "pending_outgoing" | "none";
  onAction?: () => void;
}

export function PartnerCard({
  partner,
  partnershipId,
  status,
  onAction,
}: PartnerCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    if (!partnershipId) return;
    startTransition(async () => {
      await acceptPartnerRequest(partnershipId);
      onAction?.();
    });
  };

  const handleEnd = () => {
    if (!partnershipId) return;
    startTransition(async () => {
      await endPartnership(partnershipId);
      onAction?.();
    });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {partner.avatar_url ? (
              <Image
                src={partner.avatar_url}
                alt={partner.username || "User"}
                width={48}
                height={48}
                className="object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">
              {partner.username || "Anonymous"}
            </p>
            {partner.streak !== undefined && (
              <StreakBadge count={partner.streak} className="mt-1" />
            )}
          </div>
          <div className="flex gap-2">
            {status === "pending_incoming" && (
              <>
                <Button
                  size="icon"
                  onClick={handleAccept}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={handleEnd}
                  disabled={isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            {status === "pending_outgoing" && (
              <Button size="sm" variant="outline" disabled>
                Pending
              </Button>
            )}
            {status === "active" && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEnd}
                disabled={isPending}
                className="text-zinc-400 hover:text-red-500"
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            )}
            {status === "none" && (
              <Button size="icon" variant="outline">
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
