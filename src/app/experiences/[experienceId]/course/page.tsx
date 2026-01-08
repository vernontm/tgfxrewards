import { checkExperienceAccess } from "@/lib/whop-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  PlayCircle, 
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await checkExperienceAccess(experienceId);

  if (!userId) return null;

  // Course link from Whop
  const courseUrl = "https://whop.com/joined/tgfx-trade-lab/tgfx-inner-market-mastery-trading-course-FWTfYlhQlrFhYv/app/";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Course Progress</h1>
        <p className="text-zinc-400">
          Track your progress through the Inner Market Mastery course.
        </p>
      </div>

      <Card className="bg-gradient-to-r from-brand/20 to-brand/5 border-brand/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand/20 rounded-xl">
              <GraduationCap className="w-8 h-8 text-brand" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                Inner Market Mastery
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                Master the inner workings of the market with comprehensive trading education.
              </p>
            </div>
            <Link href={courseUrl} target="_blank">
              <Button>
                <PlayCircle className="w-4 h-4 mr-2" />
                Continue Course
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">0%</div>
            <p className="text-zinc-400 text-sm">Course Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-white mb-1">0</div>
            <p className="text-zinc-400 text-sm">Lessons Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-brand mb-1">1,000</div>
            <p className="text-zinc-400 text-sm">Points on Completion</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="p-2 bg-zinc-700 rounded-lg">
                <PlayCircle className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Getting Started</p>
                <p className="text-sm text-zinc-500">Introduction to the course</p>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Not started</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="p-2 bg-zinc-700 rounded-lg">
                <PlayCircle className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Market Structure</p>
                <p className="text-sm text-zinc-500">Understanding how markets move</p>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Not started</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="p-2 bg-zinc-700 rounded-lg">
                <PlayCircle className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Entry Strategies</p>
                <p className="text-sm text-zinc-500">Finding high-probability entries</p>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Not started</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
              <div className="p-2 bg-zinc-700 rounded-lg">
                <PlayCircle className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Risk Management</p>
                <p className="text-sm text-zinc-500">Protecting your capital</p>
              </div>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>Not started</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-brand/10 border border-brand/30 rounded-xl">
            <p className="text-sm text-zinc-300">
              <strong className="text-brand">Tip:</strong> Complete the entire course to earn 1,000 bonus points! 
              Track your progress here and claim your reward in the Milestones section.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
