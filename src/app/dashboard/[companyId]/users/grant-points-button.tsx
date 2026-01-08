"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { grantPoints } from "@/actions/admin";
import { Coins } from "lucide-react";

interface GrantPointsButtonAdminProps {
  userId: string;
}

export function GrantPointsButtonAdmin({ userId }: GrantPointsButtonAdminProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleGrant = () => {
    const pointAmount = parseInt(amount);
    if (!pointAmount || !reason.trim()) return;

    startTransition(async () => {
      await grantPoints(userId, pointAmount, reason);
      setIsOpen(false);
      setAmount("");
      setReason("");
    });
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        <Coins className="w-4 h-4 mr-1" />
        Grant
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <ModalTitle>Grant Points</ModalTitle>
          <ModalDescription>
            Add bonus points to this user&apos;s account.
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Amount
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Reason
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bonus for..."
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGrant}
            disabled={isPending || !amount || !reason.trim()}
          >
            {isPending ? "Granting..." : "Grant Points"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
