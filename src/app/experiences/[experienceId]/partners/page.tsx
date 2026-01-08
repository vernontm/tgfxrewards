"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartnerCard } from "@/components/partner-card";
import { PartnerProfileForm } from "@/components/partner-profile-form";
import {
  sendPartnerRequestForUser,
  getPartnersForUser,
  getSeekingPartners,
  getMyPartnerProfile,
} from "@/actions/partners";
import { UserPlus, Users, Flame, Search, Target, Clock, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface PartnerProfile {
  user_id: string;
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
  users: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    streaks: { current_count: number; longest_count: number }[] | null;
  };
}

interface PartnerData {
  partnershipId: string;
  partner: User;
}

export default function PartnersPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  
  const [seekingPartners, setSeekingPartners] = useState<PartnerProfile[]>([]);
  const [partners, setPartners] = useState<{
    active: PartnerData[];
    pending_incoming: PartnerData[];
    pending_outgoing: PartnerData[];
  }>({ active: [], pending_incoming: [], pending_outgoing: [] });
  const [myProfile, setMyProfile] = useState<PartnerProfile | null>(null);
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    startTransition(async () => {
      const [partnersData, seeking, profileData] = await Promise.all([
        getPartnersForUser(),
        getSeekingPartners(),
        getMyPartnerProfile(),
      ]);
      
      if (partnersData.userId) {
        setUserId(partnersData.userId);
        setPartners({
          active: partnersData.active,
          pending_incoming: partnersData.pending_incoming,
          pending_outgoing: partnersData.pending_outgoing,
        });
      }
      
      setSeekingPartners(seeking as PartnerProfile[]);
      if (profileData?.profile) {
        setMyProfile(profileData.profile as PartnerProfile);
      }
    });
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;
    startTransition(async () => {
      await sendPartnerRequestForUser(userId, receiverId);
      loadData();
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedProfiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get IDs of users we already have a relationship with
  const existingRelationshipIds = new Set([
    ...partners.active.map(p => p.partner.id),
    ...partners.pending_incoming.map(p => p.partner.id),
    ...partners.pending_outgoing.map(p => p.partner.id),
  ]);

  // Filter out users we already have relationships with
  const availablePartners = seekingPartners.filter(
    p => !existingRelationshipIds.has(p.users.id)
  );

  const getExperienceLabel = (exp: string | null) => {
    const labels: Record<string, string> = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      expert: "Expert",
    };
    return exp ? labels[exp] || exp : "Not specified";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Find a Partner
          </h1>
          <p className="text-zinc-400">
            Connect with traders who match your goals and experience level.
          </p>
        </div>
        <Button 
          onClick={() => setShowProfileForm(!showProfileForm)}
          variant={myProfile ? "outline" : "default"}
        >
          <Search className="w-4 h-4 mr-2" />
          {myProfile ? "Edit My Profile" : "Create Profile"}
        </Button>
      </div>

      {showProfileForm && (
        <PartnerProfileForm 
          existingProfile={myProfile}
          onComplete={() => {
            setShowProfileForm(false);
            loadData();
          }}
        />
      )}

      {!myProfile && !showProfileForm && (
        <Card className="border-brand/30 bg-brand/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Search className="w-10 h-10 text-brand mx-auto" />
              <h3 className="text-lg font-semibold text-white">
                Create your partner profile
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mx-auto">
                Fill out a quick survey about your trading experience, goals, and what you&apos;re looking for in a partner. This helps others find you!
              </p>
              <Button onClick={() => setShowProfileForm(true)}>
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {partners.pending_incoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partners.pending_incoming.map((p) => (
              <PartnerCard
                key={p.partnershipId}
                partner={p.partner}
                partnershipId={p.partnershipId}
                status="pending_incoming"
                onAction={loadData}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {partners.pending_outgoing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sent Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partners.pending_outgoing.map((p) => (
              <PartnerCard
                key={p.partnershipId}
                partner={p.partner}
                partnershipId={p.partnershipId}
                status="pending_outgoing"
                onAction={loadData}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Partners ({partners.active.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partners.active.length > 0 ? (
            <div className="space-y-3">
              {partners.active.map((p) => (
                <PartnerCard
                  key={p.partnershipId}
                  partner={p.partner}
                  partnershipId={p.partnershipId}
                  status="active"
                  onAction={loadData}
                />
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No partners yet. Connect with community members below!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-brand" />
            Members Seeking Partners ({availablePartners.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availablePartners.length > 0 ? (
            <div className="space-y-4">
              {availablePartners.map((profile) => {
                const user = profile.users;
                const streak = user.streaks?.[0]?.current_count || 0;
                const isExpanded = expandedProfiles.has(profile.user_id);
                
                return (
                  <div
                    key={profile.user_id}
                    className="bg-zinc-800 rounded-xl overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.username || "User"}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                              <Users className="w-6 h-6 text-zinc-400" />
                            </div>
                          )}
                          <div>
                            <span className="text-white font-medium text-lg">
                              {user.username || "Anonymous"}
                            </span>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                              <span className="bg-brand/20 text-brand px-2 py-0.5 rounded-full text-xs">
                                {getExperienceLabel(profile.trading_experience)}
                              </span>
                              {streak > 0 && (
                                <span className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-brand" />
                                  {streak} day streak
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.id)}
                          disabled={isPending}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Connect
                        </Button>
                      </div>

                      {profile.trading_style && (
                        <p className="text-zinc-400 text-sm mt-3">
                          <strong className="text-zinc-300">Style:</strong> {profile.trading_style}
                        </p>
                      )}

                      {profile.bio && (
                        <p className="text-zinc-400 text-sm mt-2 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}

                      <button
                        onClick={() => toggleExpanded(profile.user_id)}
                        className="flex items-center gap-1 text-brand text-sm mt-3 hover:underline"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View full profile
                          </>
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-zinc-700 p-4 bg-zinc-800/50 space-y-3">
                        {profile.strengths && (
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Strengths</p>
                            <p className="text-zinc-300 text-sm">{profile.strengths}</p>
                          </div>
                        )}
                        {profile.weaknesses && (
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Areas to Improve</p>
                            <p className="text-zinc-300 text-sm">{profile.weaknesses}</p>
                          </div>
                        )}
                        {profile.goals && (
                          <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Goals</p>
                            <p className="text-zinc-300 text-sm">{profile.goals}</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-zinc-400 pt-2">
                          {profile.availability && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {profile.availability}
                            </span>
                          )}
                          {profile.timezone && (
                            <span>{profile.timezone}</span>
                          )}
                          {profile.years_trading && (
                            <span>{profile.years_trading} years trading</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No members seeking partners yet. Create your profile to be the first!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
