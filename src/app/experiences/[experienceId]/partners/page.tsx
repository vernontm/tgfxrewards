"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartnerCard } from "@/components/partner-card";
import { StreakBadge } from "@/components/streak-badge";
import {
  sendPartnerRequestForUser,
  getPartnersForUser,
  getAllCommunityMembers,
} from "@/actions/partners";
import { UserPlus, Users, Flame } from "lucide-react";
import Image from "next/image";

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface CommunityMember {
  id: string;
  username: string | null;
  avatar_url: string | null;
  streaks: { current_count: number; longest_count: number }[] | null;
}

interface PartnerData {
  partnershipId: string;
  partner: User;
}

export default function PartnersPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [partners, setPartners] = useState<{
    active: PartnerData[];
    pending_incoming: PartnerData[];
    pending_outgoing: PartnerData[];
  }>({ active: [], pending_incoming: [], pending_outgoing: [] });
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    startTransition(async () => {
      const [partnersData, members] = await Promise.all([
        getPartnersForUser(),
        getAllCommunityMembers(),
      ]);
      
      if (partnersData.userId) {
        setUserId(partnersData.userId);
        setPartners({
          active: partnersData.active,
          pending_incoming: partnersData.pending_incoming,
          pending_outgoing: partnersData.pending_outgoing,
        });
      }
      
      setCommunityMembers(members);
    });
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;
    startTransition(async () => {
      await sendPartnerRequestForUser(userId, receiverId);
      loadData();
    });
  };

  // Get IDs of users we already have a relationship with
  const existingRelationshipIds = new Set([
    ...partners.active.map(p => p.partner.id),
    ...partners.pending_incoming.map(p => p.partner.id),
    ...partners.pending_outgoing.map(p => p.partner.id),
  ]);

  // Filter out users we already have relationships with
  const availableMembers = communityMembers.filter(
    m => !existingRelationshipIds.has(m.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Community Members
        </h1>
        <p className="text-zinc-400">
          Connect with other members to stay accountable together.
        </p>
      </div>

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
            <Flame className="w-5 h-5 text-brand" />
            All Community Members ({availableMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableMembers.length > 0 ? (
            <div className="space-y-3">
              {availableMembers.map((member) => {
                const streak = member.streaks?.[0]?.current_count || 0;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.username || "User"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                          <Users className="w-5 h-5 text-zinc-400" />
                        </div>
                      )}
                      <div>
                        <span className="text-white font-medium">
                          {member.username || "Anonymous"}
                        </span>
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Flame className="w-3 h-3 text-brand" />
                            {streak} day streak
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(member.id)}
                      disabled={isPending}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No other members yet. Be the first to invite friends!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
