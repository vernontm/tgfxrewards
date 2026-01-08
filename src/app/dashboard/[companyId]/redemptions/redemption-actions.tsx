"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { fulfillRedemption, cancelRedemption } from "@/actions/admin";
import { Check, X } from "lucide-react";

interface RedemptionActionsAdminProps {
  redemptionId: string;
}

export function RedemptionActionsAdmin({ redemptionId }: RedemptionActionsAdminProps) {
  const [isPending, startTransition] = useTransition();

  const handleFulfill = () => {
    startTransition(async () => {
      await fulfillRedemption(redemptionId);
    });
  };

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this redemption? The user will be refunded.")) return;
    startTransition(async () => {
      await cancelRedemption(redemptionId);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handleFulfill}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        <Check className="w-4 h-4 mr-1" />
        Fulfill
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleCancel}
        disabled={isPending}
      >
        <X className="w-4 h-4 mr-1" />
        Cancel
      </Button>
    </div>
  );
}
