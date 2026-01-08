"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quickCheckin, updateCheckinSurvey } from "@/actions/checkin";
import { StreakBadge } from "./streak-badge";
import { PointsDisplay } from "./points-display";
import confetti from "canvas-confetti";
import { Flame, CheckCircle } from "lucide-react";

const moods = [
  { value: 1, emoji: "😫", label: "Struggling" },
  { value: 2, emoji: "😕", label: "Rough" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Crushing it" },
];

interface CheckinFormProps {
  existingCheckin?: {
    id: string;
    mood: number | null;
    wins: string | null;
    struggles: string | null;
    focus: string | null;
  } | null;
  currentStreak: number;
  userId: string;
}

type Step = "button" | "survey" | "complete";

export function CheckinForm({
  existingCheckin,
  currentStreak,
  userId,
}: CheckinFormProps) {
  // If they already checked in today, show survey or complete
  const [step, setStep] = useState<Step>(
    existingCheckin ? (existingCheckin.mood ? "complete" : "survey") : "button"
  );
  const [checkinId, setCheckinId] = useState<string | null>(existingCheckin?.id || null);
  const [mood, setMood] = useState<number>(existingCheckin?.mood || 0);
  const [wins, setWins] = useState(existingCheckin?.wins || "");
  const [struggles, setStruggles] = useState(existingCheckin?.struggles || "");
  const [focus, setFocus] = useState(existingCheckin?.focus || "");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    pointsEarned?: number;
    newStreak?: number;
    milestone?: string | null;
  } | null>(null);

  // Step 1: Quick check-in button
  const handleQuickCheckin = () => {
    startTransition(async () => {
      const response = await quickCheckin(userId);

      if (response.success) {
        setCheckinId(response.checkinId || null);
        setResult({
          pointsEarned: response.pointsEarned,
          newStreak: response.newStreak,
          milestone: response.milestone,
        });

        if (response.milestone) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#f59e0b", "#fbbf24", "#fcd34d"],
          });
        }

        setStep("survey");
      }
    });
  };

  // Step 2: Submit survey
  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinId || mood === 0) return;

    startTransition(async () => {
      await updateCheckinSurvey(checkinId, {
        mood,
        wins: wins || null,
        struggles: struggles || null,
        focus: focus || null,
      });
      setStep("complete");
    });
  };

  // Skip survey
  const handleSkipSurvey = () => {
    setStep("complete");
  };

  // Step 1: Check-in button
  if (step === "button") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-8 h-8 text-amber-500" />
              <StreakBadge count={currentStreak} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Ready to check in?
              </h2>
              <p className="text-zinc-400">
                Click below to log your daily check-in and keep your streak going!
              </p>
            </div>
            <Button
              onClick={handleQuickCheckin}
              disabled={isPending}
              size="lg"
              className="w-full max-w-xs text-lg py-6"
            >
              {isPending ? (
                "Checking in..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Check In Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Survey form
  if (step === "survey") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daily Survey</span>
            {result && (
              <div className="flex items-center gap-3">
                {result.pointsEarned !== undefined && result.pointsEarned > 0 && (
                  <PointsDisplay points={result.pointsEarned} size="sm" />
                )}
                <StreakBadge count={result.newStreak || currentStreak} />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result?.milestone && (
            <div className="mb-4 p-3 bg-amber-500/20 rounded-xl text-center">
              <p className="text-amber-500 font-semibold">🎉 {result.milestone}</p>
            </div>
          )}
          <p className="text-zinc-400 mb-4">
            Great job checking in! Take a moment to reflect on your day.
          </p>
          <form onSubmit={handleSurveySubmit} className="space-y-6">
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipSurvey}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                disabled={mood === 0 || isPending}
                className="flex-1"
              >
                {isPending ? "Saving..." : "Submit Survey"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Complete
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-semibold text-white">
            You&apos;re checked in for today!
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-zinc-400 text-sm">Current Streak</p>
              <StreakBadge count={result?.newStreak || currentStreak} showLabel={false} />
            </div>
          </div>
          <Button
            onClick={() => setStep("survey")}
            variant="outline"
            className="mt-4"
          >
            {existingCheckin?.mood ? "Edit Survey" : "Fill Out Survey"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
