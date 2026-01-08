"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { 
  getAllMilestones, 
  createMilestone, 
  updateMilestone, 
  deleteMilestone,
  getPendingMilestones,
  approveMilestone,
  rejectMilestone
} from "@/actions/admin";
import { Target, Plus, Check, X, Trash2, Edit2 } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  points: number;
  milestone_type: string;
  requirement_value: number;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

interface PendingMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  notes: string | null;
  completed_at: string;
  users: { id: string; username: string | null; avatar_url: string | null };
  milestones: { title: string; description: string | null; points: number; milestone_type: string };
}

const MILESTONE_TYPES = [
  { value: "broker_referral", label: "Broker Referral" },
  { value: "discord_join", label: "Discord Join" },
  { value: "course_complete", label: "Course Complete" },
  { value: "introduction", label: "Introduction" },
  { value: "checkin_streak", label: "Check-in Streak" },
  { value: "custom", label: "Custom" },
];

export default function AdminMilestonesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [pendingMilestones, setPendingMilestones] = useState<PendingMilestone[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    points: 100,
    milestone_type: "custom",
    requirement_value: 1,
    icon: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    startTransition(async () => {
      const [milestonesData, pendingData] = await Promise.all([
        getAllMilestones(),
        getPendingMilestones(),
      ]);
      setMilestones(milestonesData);
      setPendingMilestones(pendingData as PendingMilestone[]);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingId) {
        await updateMilestone(editingId, formData);
      } else {
        await createMilestone(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        points: 100,
        milestone_type: "custom",
        requirement_value: 1,
        icon: "",
      });
      loadData();
    });
  };

  const handleEdit = (milestone: Milestone) => {
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      points: milestone.points,
      milestone_type: milestone.milestone_type,
      requirement_value: milestone.requirement_value,
      icon: milestone.icon || "",
    });
    setEditingId(milestone.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    startTransition(async () => {
      await deleteMilestone(id);
      loadData();
    });
  };

  const handleApprove = async (userMilestoneId: string) => {
    startTransition(async () => {
      await approveMilestone(userMilestoneId, "admin");
      loadData();
    });
  };

  const handleReject = async (userMilestoneId: string) => {
    if (!confirm("Are you sure you want to reject this submission?")) return;
    startTransition(async () => {
      await rejectMilestone(userMilestoneId);
      loadData();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Milestones</h1>
          <p className="text-zinc-400">
            Manage milestone tasks and approve submissions.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Milestone" : "Create Milestone"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Join Discord"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What the user needs to do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Points</label>
                  <Input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Type</label>
                  <select
                    value={formData.milestone_type}
                    onChange={(e) => setFormData({ ...formData, milestone_type: e.target.value })}
                    className="w-full h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                  >
                    {MILESTONE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.milestone_type === "checkin_streak" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Required Streak Days
                  </label>
                  <Input
                    type="number"
                    value={formData.requirement_value}
                    onChange={(e) => setFormData({ ...formData, requirement_value: parseInt(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pendingMilestones.length > 0 && (
        <Card className="border-brand/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-brand" />
              Pending Approvals ({pendingMilestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingMilestones.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                <div>
                  <p className="font-medium text-white">
                    {pm.users?.username || "Anonymous"} - {pm.milestones?.title}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {pm.milestones?.points} points • {pm.notes || "No proof provided"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(pm.id)} disabled={isPending}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(pm.id)} disabled={isPending}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length > 0 ? (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{milestone.title}</p>
                      {!milestone.is_active && (
                        <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">
                      {milestone.points} points • {MILESTONE_TYPES.find(t => t.value === milestone.milestone_type)?.label}
                      {milestone.milestone_type === "checkin_streak" && ` (${milestone.requirement_value} days)`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(milestone)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(milestone.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No milestones yet. Create one to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
