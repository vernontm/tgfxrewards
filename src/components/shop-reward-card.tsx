"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { PointsDisplay } from "./points-display";
import { redeemRewardForUser } from "@/actions/rewards";
import { Gift, Check, Lock } from "lucide-react";

interface ShopRewardCardProps {
  reward: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    point_cost: number;
    quantity: number | null;
    claimed_count: number;
  };
  userBalance: number;
  userId: string;
}

export function ShopRewardCard({ reward, userBalance, userId }: ShopRewardCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [redeemed, setRedeemed] = useState(false);

  const remaining =
    reward.quantity !== null ? reward.quantity - reward.claimed_count : null;
  const isSoldOut = remaining !== null && remaining <= 0;
  const canAfford = userBalance >= reward.point_cost;
  const pointsNeeded = reward.point_cost - userBalance;

  const handleRedeem = () => {
    startTransition(async () => {
      const result = await redeemRewardForUser(reward.id, userId);
      if (result.success) {
        setRedeemed(true);
        setIsModalOpen(false);
      }
    });
  };

  if (redeemed) {
    return (
      <Card className="relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
          <div className="text-center">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-green-500 font-semibold">Redeemed!</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={`flex flex-col h-full relative ${!canAfford && !isSoldOut ? "opacity-80" : ""}`}>
        {/* Lock overlay for unaffordable items */}
        {!canAfford && !isSoldOut && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-zinc-900/90 rounded-full p-2">
              <Lock className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        )}
        
        <CardContent className="flex-1 pt-6">
          <div className="aspect-video bg-zinc-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {reward.image_url ? (
              <Image
                src={reward.image_url}
                alt={reward.title}
                width={300}
                height={169}
                className="object-cover w-full h-full"
              />
            ) : (
              <Gift className="w-12 h-12 text-zinc-600" />
            )}
          </div>
          <h3 className="font-semibold text-white mb-2">{reward.title}</h3>
          {reward.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{reward.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <PointsDisplay points={reward.point_cost} size="sm" />
            {remaining !== null && (
              <Badge variant={isSoldOut ? "destructive" : "secondary"}>
                {isSoldOut ? "Sold Out" : `${remaining} left`}
              </Badge>
            )}
            {!canAfford && !isSoldOut && (
              <Badge variant="secondary" className="text-zinc-400 border-zinc-600">
                Need {pointsNeeded.toLocaleString()} more
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={isSoldOut || !canAfford}
            variant={!canAfford ? "outline" : "default"}
            className="w-full"
          >
            {isSoldOut ? (
              "Sold Out"
            ) : !canAfford ? (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Locked
              </span>
            ) : (
              "Redeem"
            )}
          </Button>
        </CardFooter>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>Confirm Redemption</ModalTitle>
          <ModalDescription>
            Are you sure you want to redeem {reward.title} for{" "}
            {reward.point_cost.toLocaleString()} points?
          </ModalDescription>
        </ModalHeader>
        <div className="py-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Your balance</span>
            <span className="text-white">
              {userBalance.toLocaleString()} points
            </span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-zinc-400">Cost</span>
            <span className="text-brand">
              -{reward.point_cost.toLocaleString()} points
            </span>
          </div>
          <div className="border-t border-zinc-700 mt-3 pt-3 flex justify-between text-sm font-semibold">
            <span className="text-zinc-400">Remaining</span>
            <span className="text-white">
              {(userBalance - reward.point_cost).toLocaleString()} points
            </span>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRedeem} disabled={isPending}>
            {isPending ? "Redeeming..." : "Confirm"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
