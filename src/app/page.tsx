import { Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-brand mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">TGFX Rewards</h1>
        <p className="text-zinc-400 max-w-md">
          This app runs inside Whop. Access it through your Whop dashboard or product page.
        </p>
      </div>
    </div>
  );
}
