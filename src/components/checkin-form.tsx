"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitCheckin } from "@/actions/checkin";
import { StreakBadge } from "./streak-badge";
import { PointsDisplay } from "./points-display";
import confetti from "canvas-confetti";

const moods = [
  { value: 1, emoji: "😫", label: "Struggling" },
  { value: 2, emoji: "😕", label: "Rough" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Crushing it" },
];

interface CheckinFormProps {
  existingCheckin?: {
    mood: number;
    wins: string | null;
    struggles: string | null;
    focus: string | null;
  } | null;
  currentStreak: number;
  userId: string;
}

export function CheckinForm({
  existingCheckin,
  currentStreak,
  userId,
}: CheckinFormProps) {
  const [mood, setMood] = useState<number>(existingCheckin?.mood || 0);
  const [wins, setWins] = useState(existingCheckin?.wins || "");
  const [struggles, setStruggles] = useState(existingCheckin?.struggles || "");
  const [focus, setFocus] = useState(existingCheckin?.focus || "");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    pointsEarned?: number;
    newStreak?: number;
    milestone?: string | null;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mood === 0) return;

    startTransition(async () => {
      const response = await submitCheckin({
        mood,
        wins: wins || null,
        struggles: struggles || null,
        focus: focus || null,
        userId,
      });

      setResult(response);

      if (response.success && response.milestone) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
        });
      }
    });
  };

  if (result?.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">
              {result.milestone ? "🎉" : "✅"}
            </div>
            <h2 className="text-xl font-semibold text-white">
              {existingCheckin ? "Check-in Updated!" : "Check-in Complete!"}
            </h2>
            {result.milestone && (
              <p className="text-amber-500 font-semibold text-lg">
                {result.milestone}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              {result.pointsEarned !== undefined && result.pointsEarned > 0 && (
                <div className="text-center">
                  <p className="text-zinc-400 text-sm">Points Earned</p>
                  <PointsDisplay points={result.pointsEarned} size="lg" />
                </div>
              )}
              {result.newStreak !== undefined && (
                <div className="text-center">
                  <p className="text-zinc-400 text-sm">Current Streak</p>
                  <StreakBadge count={result.newStreak} showLabel={false} />
                </div>
              )}
            </div>
            <Button
              onClick={() => setResult(null)}
              variant="outline"
              className="mt-4"
            >
              Edit Check-in
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Daily Check-in</span>
          <StreakBadge count={currentStreak} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-3">
              How are you feeling today?
            </label>
            <div className="flex gap-2 flex-wrap">
              {moods.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                    mood === m.value
                      ? "bg-amber-500/20 ring-2 ring-amber-500"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs text-zinc-400 mt-1">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Wins from today
            </label>
            <Textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well? What are you proud of?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Struggles or challenges
            </label>
            <Textarea
              value={struggles}
              onChange={(e) => setStruggles(e.target.value)}
              placeholder="What was difficult? What held you back?"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tomorrow&apos;s focus
            </label>
            <Textarea
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="What's your main priority for tomorrow?"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={mood === 0 || isPending}
            className="w-full"
            size="lg"
          >
            {isPending
              ? "Submitting..."
              : existingCheckin
              ? "Update Check-in"
              : "Submit Check-in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
