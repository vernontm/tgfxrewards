"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteReward, updateReward } from "@/actions/admin";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface RewardActionsAdminProps {
  reward: {
    id: string;
    is_active: boolean;
  };
}

export function RewardActionsAdmin({ reward }: RewardActionsAdminProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await updateReward(reward.id, { is_active: !reward.is_active });
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    startTransition(async () => {
      await deleteReward(reward.id);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={handleToggle}
        disabled={isPending}
        title={reward.is_active ? "Deactivate" : "Activate"}
      >
        {reward.is_active ? (
          <ToggleRight className="w-5 h-5 text-green-500" />
        ) : (
          <ToggleLeft className="w-5 h-5 text-zinc-500" />
        )}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDelete}
        disabled={isPending}
        className="text-red-500 hover:text-red-400"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
