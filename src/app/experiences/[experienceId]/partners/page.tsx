"use client";

import { useState, useTransition, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PartnerCard } from "@/components/partner-card";
import {
  searchUsers,
  sendPartnerRequestForUser,
  getPartnersForUser,
} from "@/actions/partners";
import { Search, UserPlus, Users } from "lucide-react";

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface PartnerData {
  partnershipId: string;
  partner: User;
}

export default function PartnersPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [partners, setPartners] = useState<{
    active: PartnerData[];
    pending_incoming: PartnerData[];
    pending_outgoing: PartnerData[];
  }>({ active: [], pending_incoming: [], pending_outgoing: [] });
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get userId from a server action or context
    loadPartners();
  }, []);

  const loadPartners = () => {
    startTransition(async () => {
      const data = await getPartnersForUser();
      if (data.userId) {
        setUserId(data.userId);
        setPartners({
          active: data.active,
          pending_incoming: data.pending_incoming,
          pending_outgoing: data.pending_outgoing,
        });
      }
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!userId) return;
    startTransition(async () => {
      await sendPartnerRequestForUser(userId, receiverId);
      setSearchResults((prev) => prev.filter((u) => u.id !== receiverId));
      loadPartners();
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Accountability Partners
        </h1>
        <p className="text-zinc-400">
          Connect with others to stay accountable together.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"
                >
                  <span className="text-white">
                    {user.username || "Anonymous"}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleSendRequest(user.id)}
                    disabled={isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {partners.pending_incoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
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
                onAction={loadPartners}
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
                onAction={loadPartners}
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
                  onAction={loadPartners}
                />
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-center py-8">
              No partners yet. Search for users to connect with!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
