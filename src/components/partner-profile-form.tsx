"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { savePartnerProfile, PartnerProfileData } from "@/actions/partners";
import { UserCircle, Target, Clock, MapPin } from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Less than 1 year" },
  { value: "intermediate", label: "Intermediate", desc: "1-3 years" },
  { value: "advanced", label: "Advanced", desc: "3-5 years" },
  { value: "expert", label: "Expert", desc: "5+ years" },
];

const AGE_RANGES = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

interface PartnerProfileFormProps {
  existingProfile?: {
    is_seeking_partner: boolean;
    trading_experience: string | null;
    years_trading: number | null;
    trading_style: string | null;
    strengths: string | null;
    weaknesses: string | null;
    goals: string | null;
    availability: string | null;
    timezone: string | null;
    gender: string | null;
    age_range: string | null;
    bio: string | null;
  } | null;
  onComplete?: () => void;
}

export function PartnerProfileForm({ existingProfile, onComplete }: PartnerProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState<PartnerProfileData>({
    is_seeking_partner: existingProfile?.is_seeking_partner ?? true,
    trading_experience: existingProfile?.trading_experience || "beginner",
    years_trading: existingProfile?.years_trading || null,
    trading_style: existingProfile?.trading_style || null,
    strengths: existingProfile?.strengths || null,
    weaknesses: existingProfile?.weaknesses || null,
    goals: existingProfile?.goals || null,
    availability: existingProfile?.availability || null,
    timezone: existingProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    gender: existingProfile?.gender || null,
    age_range: existingProfile?.age_range || null,
    bio: existingProfile?.bio || null,
  });

  const updateField = <K extends keyof PartnerProfileData>(
    field: K,
    value: PartnerProfileData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await savePartnerProfile(formData);
      if (result.success) {
        setSaved(true);
        onComplete?.();
      }
    });
  };

  if (saved) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-semibold text-white">
              Profile Saved!
            </h2>
            <p className="text-zinc-400">
              You&apos;re now visible to other members looking for partners.
            </p>
            <Button onClick={() => setSaved(false)} variant="outline">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-brand" />
          {existingProfile ? "Edit Your Partner Profile" : "Create Your Partner Profile"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? "bg-brand" : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-zinc-400">
            Step {step} of 3
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">
                Trading Experience Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => updateField("trading_experience", level.value)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      formData.trading_experience === level.value
                        ? "bg-brand/20 ring-2 ring-brand"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    <span className="block text-white font-medium">{level.label}</span>
                    <span className="text-xs text-zinc-400">{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Years Trading (optional)
              </label>
              <Input
                type="number"
                value={formData.years_trading || ""}
                onChange={(e) => updateField("years_trading", e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 2"
                min={0}
                max={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Trading Style
              </label>
              <Input
                value={formData.trading_style || ""}
                onChange={(e) => updateField("trading_style", e.target.value || null)}
                placeholder="e.g., Day trading, Swing trading, Options, Crypto..."
              />
            </div>

            <Button onClick={() => setStep(2)} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                Your Strengths
              </label>
              <Textarea
                value={formData.strengths || ""}
                onChange={(e) => updateField("strengths", e.target.value || null)}
                placeholder="What are you good at? Technical analysis, risk management, patience..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Areas to Improve
              </label>
              <Textarea
                value={formData.weaknesses || ""}
                onChange={(e) => updateField("weaknesses", e.target.value || null)}
                placeholder="What do you want to get better at? Discipline, cutting losses..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Trading Goals
              </label>
              <Textarea
                value={formData.goals || ""}
                onChange={(e) => updateField("goals", e.target.value || null)}
                placeholder="What are you working towards? Consistency, full-time trading..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Availability
              </label>
              <Input
                value={formData.availability || ""}
                onChange={(e) => updateField("availability", e.target.value || null)}
                placeholder="e.g., Weekday mornings, Market hours..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <Input
                value={formData.timezone || ""}
                onChange={(e) => updateField("timezone", e.target.value || null)}
                placeholder="e.g., EST, PST, UTC..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Age Range (optional)
                </label>
                <select
                  value={formData.age_range || ""}
                  onChange={(e) => updateField("age_range", e.target.value || null)}
                  className="w-full h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                >
                  <option value="">Select...</option>
                  {AGE_RANGES.map((age) => (
                    <option key={age.value} value={age.value}>
                      {age.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Gender (optional)
                </label>
                <select
                  value={formData.gender || ""}
                  onChange={(e) => updateField("gender", e.target.value || null)}
                  className="w-full h-10 rounded-xl border border-zinc-700 bg-zinc-800 px-3 text-sm text-white"
                >
                  <option value="">Select...</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Bio / About You
              </label>
              <Textarea
                value={formData.bio || ""}
                onChange={(e) => updateField("bio", e.target.value || null)}
                placeholder="Tell potential partners a bit about yourself..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
              <input
                type="checkbox"
                id="seeking"
                checked={formData.is_seeking_partner}
                onChange={(e) => updateField("is_seeking_partner", e.target.checked)}
                className="w-4 h-4 rounded accent-brand"
              />
              <label htmlFor="seeking" className="text-sm text-zinc-300">
                I&apos;m actively looking for an accountability partner
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
                {isPending ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
