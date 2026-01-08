import { Flame } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <Flame className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Daily Grind</h1>
        <p className="text-zinc-400 max-w-md">
          This app runs inside Whop. Access it through your Whop dashboard or product page.
        </p>
      </div>
    </div>
  );
}
