"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp
} from "lucide-react";
import confetti from "canvas-confetti";

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
    // For broker referral, show the form instead of submitting directly
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

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Target;
  };

  const totalPoints = milestones.reduce((sum, m) => sum + m.points, 0);
  const earnedPoints = milestones
    .filter(m => completedIds.has(m.id))
    .reduce((sum, m) => sum + m.points, 0);

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

      <div className="space-y-4">
        {milestones.map((milestone) => {
          const isCompleted = completedIds.has(milestone.id);
          const isPendingReview = pendingIds.has(milestone.id);
          const canClaim = canClaimStreak(milestone);
          const Icon = getIcon(milestone.icon);
          const isStreakMilestone = milestone.milestone_type === "checkin_streak";
          const isBrokerReferral = milestone.milestone_type === "broker_referral";
          const needsVerification = ["broker_referral", "discord_join", "introduction", "trade_count"].includes(milestone.milestone_type);
          const showingBrokerForm = showBrokerForm === milestone.id;

          return (
            <Card 
              key={milestone.id}
              className={isCompleted ? "border-brand/50 bg-brand/5" : isPendingReview ? "border-yellow-500/50 bg-yellow-500/5" : ""}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${isCompleted ? "bg-brand/20" : isPendingReview ? "bg-yellow-500/20" : "bg-zinc-800"}`}>
                    <Icon className={`w-6 h-6 ${isCompleted ? "text-brand" : isPendingReview ? "text-yellow-500" : "text-zinc-400"}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          {milestone.title}
                          {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-brand" />
                          )}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          {milestone.description}
                        </p>
                        {isStreakMilestone && !isCompleted && !isPendingReview && (
                          <p className="text-xs text-zinc-500 mt-2">
                            Your best streak: {Math.max(streak?.current_count || 0, streak?.longest_count || 0)} days
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-brand font-semibold">
                          <Gift className="w-4 h-4" />
                          {milestone.points.toLocaleString()}
                        </div>
                        
                        {isCompleted ? (
                          <span className="text-xs text-brand mt-2 block">Completed!</span>
                        ) : isPendingReview ? (
                          <span className="text-xs text-yellow-500 mt-2 block">Pending Review</span>
                        ) : canClaim ? (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => needsVerification ? handleSubmitForReview(milestone) : handleClaim(milestone)}
                            disabled={isPending && claimingId === milestone.id}
                          >
                            {isPending && claimingId === milestone.id 
                              ? "..." 
                              : needsVerification 
                                ? "Submit" 
                                : "Claim"
                            }
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                            <Lock className="w-3 h-3" />
                            Locked
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Broker Referral Form */}
                    {showingBrokerForm && (
                      <form onSubmit={handleBrokerSubmit} className="mt-4 p-4 bg-zinc-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-white">Verify Your Broker Account</p>
                          <button 
                            type="button"
                            onClick={() => setShowBrokerForm(null)}
                            className="text-zinc-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-400 mb-3">
                          Enter the name and email you used to sign up with our partner broker. We&apos;ll verify your account manually.
                        </p>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Full Name (as registered)</label>
                          <Input
                            value={brokerFormData.fullName}
                            onChange={(e) => setBrokerFormData({ ...brokerFormData, fullName: e.target.value })}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Email (as registered)</label>
                          <Input
                            type="email"
                            value={brokerFormData.email}
                            onChange={(e) => setBrokerFormData({ ...brokerFormData, email: e.target.value })}
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            size="sm"
                            disabled={isPending || !brokerFormData.fullName || !brokerFormData.email}
                          >
                            {isPending ? "Submitting..." : "Submit for Review"}
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowBrokerForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
