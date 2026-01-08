import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface ActivityItemProps {
  activity: {
    id: string;
    user: {
      username: string | null;
      avatar_url: string | null;
    };
    checkin_date: string;
    mood: number;
    wins: string | null;
    struggles: string | null;
    focus: string | null;
    created_at: string;
  };
}

const moodEmojis: Record<number, string> = {
  1: "😫",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🔥",
};

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
            {activity.user.avatar_url ? (
              <Image
                src={activity.user.avatar_url}
                alt={activity.user.username || "User"}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">
                {activity.user.username || "Anonymous"}
              </span>
              <span className="text-2xl">{moodEmojis[activity.mood]}</span>
              <span className="text-xs text-zinc-500">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {activity.wins && (
                <div>
                  <Badge variant="success" className="mb-1">
                    Wins
                  </Badge>
                  <p className="text-sm text-zinc-300">{activity.wins}</p>
                </div>
              )}
              {activity.struggles && (
                <div>
                  <Badge variant="warning" className="mb-1">
                    Struggles
                  </Badge>
                  <p className="text-sm text-zinc-300">{activity.struggles}</p>
                </div>
              )}
              {activity.focus && (
                <div>
                  <Badge variant="default" className="mb-1">
                    Tomorrow&apos;s Focus
                  </Badge>
                  <p className="text-sm text-zinc-300">{activity.focus}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
