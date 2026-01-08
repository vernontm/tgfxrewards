"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createReward } from "@/actions/admin";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewRewardPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const point_cost = parseInt(formData.get("point_cost") as string);
    const quantity = formData.get("quantity") as string;
    const expires_at = formData.get("expires_at") as string;

    if (!title || !point_cost) {
      setError("Title and point cost are required");
      return;
    }

    startTransition(async () => {
      const result = await createReward({
        title,
        description: description || undefined,
        image_url: image_url || undefined,
        point_cost,
        quantity: quantity ? parseInt(quantity) : undefined,
        expires_at: expires_at || undefined,
      });

      if (result.success) {
        router.push(`/dashboard/${companyId}/rewards`);
      } else {
        setError(result.error || "Failed to create reward");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/${companyId}/rewards`}
          className="text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rewards
        </Link>
        <h1 className="text-2xl font-bold text-white">Create New Reward</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Title *
              </label>
              <Input name="title" placeholder="Reward title" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Description
              </label>
              <Textarea
                name="description"
                placeholder="Describe the reward..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Image URL
              </label>
              <Input
                name="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Point Cost *
                </label>
                <Input
                  name="point_cost"
                  type="number"
                  min="1"
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Quantity (optional)
                </label>
                <Input
                  name="quantity"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Expires At (optional)
              </label>
              <Input name="expires_at" type="datetime-local" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Creating..." : "Create Reward"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/${companyId}/rewards`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
