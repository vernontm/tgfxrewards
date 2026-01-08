"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMilestonesWithStatus, claimMilestone, submitMilestoneForReview } from "@/actions/milestones";
import { 
  Target, 
  CheckCircle, 
  Flame, 
  MessageCircle, 
  GraduationCap, 
  UserPlus, 
  Building,
  Lock,
  Gift,
  X,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";

interface Milestone {
  id: string;
  title: string;
  description: string;
  points: number;
  milestone_type: string;
  requirement_value: number;
  icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  "message-circle": MessageCircle,
  "graduation-cap": GraduationCap,
  "user-plus": UserPlus,
  building: Building,
  "trending-up": TrendingUp,
};

// PlexyTrade referral link
const BROKER_REFERRAL_LINK = "https://plexytrade.com/?t=TBZp1B&term=register";

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<{ current_count: number; longest_count: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [showBrokerForm, setShowBrokerForm] = useState<string | null>(null);
  const [brokerFormData, setBrokerFormData] = useState({ fullName: "", email: "" });

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = () => {
    startTransition(async () => {
      const data = await getMilestonesWithStatus();
      setMilestones(data.milestones);
      setCompletedIds(data.completedIds);
      setPendingIds(data.pendingIds || new Set());
      setStreak(data.streak || null);
    });
  };

  const handleClaim = async (milestone: Milestone) => {
    setClaimingId(milestone.id);
    startTransition(async () => {
      const result = await claimMilestone(milestone.id);
      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#5abcd2", "#7fcce0", "#a3dced"],
        });
        loadMilestones();
      }
      setClaimingId(null);
    });
  };

  const handleSubmitForReview = async (milestone: Milestone) => {
    if (milestone.milestone_type === "broker_referral") {
      setShowBrokerForm(milestone.id);
      return;
    }
    
    setClaimingId(milestone.id);
    startTransition(async () => {
      const result = await submitMilestoneForReview(milestone.id);
      if (result.success) {
        loadMilestones();
      }
      setClaimingId(null);
    });
  };

  const handleBrokerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBrokerForm || !brokerFormData.fullName || !brokerFormData.email) return;
    
    setClaimingId(showBrokerForm);
    startTransition(async () => {
      const result = await submitMilestoneForReview(
        showBrokerForm, 
        undefined, 
        { fullName: brokerFormData.fullName, email: brokerFormData.email }
      );
      if (result.success) {
        setShowBrokerForm(null);
        setBrokerFormData({ fullName: "", email: "" });
        loadMilestones();
      }
      setClaimingId(null);
    });
  };

  const canClaimStreak = (milestone: Milestone) => {
    if (milestone.milestone_type !== "checkin_streak") return true;
    const maxStreak = Math.max(streak?.current_count || 0, streak?.longest_count || 0);
    return maxStreak >= milestone.requirement_value;
  };

  const getStreakProgress = (milestone: Milestone) => {
    if (milestone.milestone_type !== "checkin_streak") return 100;
    const maxStreak = Math.max(streak?.current_count || 0, streak?.longest_count || 0);
    return Math.min((maxStreak / milestone.requirement_value) * 100, 100);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Target;
  };

  const totalPoints = milestones.reduce((sum, m) => sum + m.points, 0);
  const earnedPoints = milestones
    .filter(m => completedIds.has(m.id))
    .reduce((sum, m) => sum + m.points, 0);

  // Group milestones by type
  const groupedMilestones = milestones.reduce((acc, milestone) => {
    const type = milestone.milestone_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(milestone);
    return acc;
  }, {} as Record<string, Milestone[]>);

  const categoryLabels: Record<string, string> = {
    broker_referral: "Broker",
    discord_join: "Community",
    course_complete: "Education",
    introduction: "Community",
    checkin_streak: "Streaks",
    trade_count: "Trading",
    custom: "Other",
  };

  const categoryColors: Record<string, string> = {
    broker_referral: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    discord_join: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30",
    course_complete: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    introduction: "from-pink-500/20 to-pink-500/5 border-pink-500/30",
    checkin_streak: "from-orange-500/20 to-orange-500/5 border-orange-500/30",
    trade_count: "from-brand/20 to-brand/5 border-brand/30",
    custom: "from-zinc-500/20 to-zinc-500/5 border-zinc-500/30",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Milestones</h1>
        <p className="text-zinc-400">
          Complete tasks to earn bonus points and rewards.
        </p>
      </div>

      <Card className="bg-gradient-to-r from-brand/20 to-brand/5 border-brand/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm">Points Earned from Milestones</p>
              <p className="text-3xl font-bold text-white">
                {earnedPoints.toLocaleString()} <span className="text-lg text-zinc-400">/ {totalPoints.toLocaleString()}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-brand">
                {completedIds.size} / {milestones.length}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand transition-all duration-500"
              style={{ width: `${milestones.length > 0 ? (completedIds.size / milestones.length) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {milestones.map((milestone) => {
          const isCompleted = completedIds.has(milestone.id);
          const isPendingReview = pendingIds.has(milestone.id);
          const canClaim = canClaimStreak(milestone);
          const Icon = getIcon(milestone.icon);
          const isStreakMilestone = milestone.milestone_type === "checkin_streak";
          const isBrokerReferral = milestone.milestone_type === "broker_referral";
          const needsVerification = ["broker_referral", "discord_join", "introduction", "trade_count"].includes(milestone.milestone_type);
          const showingBrokerForm = showBrokerForm === milestone.id;
          const progress = isCompleted ? 100 : isPendingReview ? 100 : getStreakProgress(milestone);

          return (
            <div
              key={milestone.id}
              className={`relative rounded-2xl border p-4 bg-gradient-to-br transition-all hover:scale-[1.02] ${
                isCompleted 
                  ? "border-brand/50 bg-brand/10" 
                  : isPendingReview 
                    ? "border-yellow-500/50 bg-yellow-500/10" 
                    : categoryColors[milestone.milestone_type] || categoryColors.custom
              }`}
            >
              {/* Status Badge */}
              {isCompleted && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-brand" />
                </div>
              )}
              {isPendingReview && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                </div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                isCompleted ? "bg-brand/20" : isPendingReview ? "bg-yellow-500/20" : "bg-zinc-800/80"
              }`}>
                <Icon className={`w-6 h-6 ${
                  isCompleted ? "text-brand" : isPendingReview ? "text-yellow-500" : "text-zinc-400"
                }`} />
              </div>

              {/* Title & Points */}
              <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                {milestone.title}
              </h3>
              <div className="flex items-center gap-1 text-brand text-sm font-medium mb-2">
                <Gift className="w-3 h-3" />
                {milestone.points.toLocaleString()} pts
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? "bg-brand" : isPendingReview ? "bg-yellow-500" : "bg-zinc-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Action Area */}
              <div className="space-y-2">
                {isCompleted ? (
                  <p className="text-xs text-brand font-medium">Completed!</p>
                ) : isPendingReview ? (
                  <p className="text-xs text-yellow-500 font-medium">Pending Review</p>
                ) : !canClaim ? (
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Lock className="w-3 h-3" />
                    {Math.max(streak?.current_count || 0, streak?.longest_count || 0)}/{milestone.requirement_value} days
                  </div>
                ) : (
                  <>
                    {isBrokerReferral && (
                      <Link href={BROKER_REFERRAL_LINK} target="_blank">
                        <Button size="sm" variant="outline" className="w-full text-xs h-7">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Sign Up
                        </Button>
                      </Link>
                    )}
                    <Button
                      size="sm"
                      className="w-full text-xs h-7"
                      onClick={() => needsVerification ? handleSubmitForReview(milestone) : handleClaim(milestone)}
                      disabled={isPending && claimingId === milestone.id}
                    >
                      {isPending && claimingId === milestone.id 
                        ? "..." 
                        : needsVerification 
                          ? "Verify" 
                          : "Claim"
                      }
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Broker Verification Modal */}
      {showBrokerForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <form onSubmit={handleBrokerSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Verify Your Broker Account</h3>
                  <button 
                    type="button"
                    onClick={() => setShowBrokerForm(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-zinc-400">
                  Enter the name and email you used to sign up with PlexyTrade. We&apos;ll verify your account manually.
                </p>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Full Name (as registered)</label>
                  <Input
                    value={brokerFormData.fullName}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Email (as registered)</label>
                  <Input
                    type="email"
                    value={brokerFormData.email}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowBrokerForm(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isPending || !brokerFormData.fullName || !brokerFormData.email}
                  >
                    {isPending ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {milestones.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-zinc-500 text-center py-8">
              No milestones available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
