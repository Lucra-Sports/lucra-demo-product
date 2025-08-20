"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NumberDisplay from "../../components/NumberDisplay";
import {
  generateNumber as fetchNumber,
  getCurrentUser,
  getBindings,
  deleteBindings,
  getLeaderboard,
} from "../../lib/api";
import { useRouter } from "next/navigation";
import { getNavigation } from "../../lib/lucraClient";
import RedirectPrompt from "../../components/RedirectPrompt";

export default function Dashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<number[]>([]);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [isDeletingBindings, setIsDeletingBindings] = useState(false);
  const [bindings, setBindings] = useState<any>(null);
  const [matchupId, setMatchupId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [router, user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Bindings
        if (user && !bindings) {
          const bindings = await getBindings();
          if (bindings) setBindings(bindings);
        }

        // Leaderboard
        const leaderboard = await getLeaderboard();
        if (leaderboard) setLeaderboard(leaderboard);
      } catch (err: any) {
        console.error("!!!: RNG: Dashboard - error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const generateNumber = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setTargetNumber(null);
    setMatchupId(null);
    try {
      const data = await fetchNumber();
      setTargetNumber(data.number);
      setMatchupId(data.matchupId);
    } catch (err: any) {
      alert(err.message || "Failed to generate number");
      setIsGenerating(false);
    }
  };

  const handleAnimationComplete = (finalNumber: number) => {
    setIsGenerating(false);
    setGenerationHistory((prev) => [finalNumber, ...prev.slice(0, 9)]);
  };

  const handleDeleteBindings = async () => {
    if (isDeletingBindings) return;
    setIsDeletingBindings(true);
    try {
      await deleteBindings();
      alert("Bindings deleted successfully");
    } catch (err: any) {
      alert(err.message || "Failed to delete bindings");
    } finally {
      setIsDeletingBindings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 -right-20 w-60 h-60 bg-white/5 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/4 -left-20 w-32 h-32 bg-white/10 rounded-full animate-ping"></div>
      </div>

      {/* Profile button */}
      <Link href="/profile" className="fixed top-6 right-6 z-40">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
          <i className="ri-user-line text-white text-xl"></i>
        </div>
      </Link>

      {/* Main content */}
      <div className="flex flex-col h-screen pt-20 pb-32 px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-['Pacifico'] text-6xl text-white mb-6 drop-shadow-lg">
            RNG Tournaments
          </h1>
        </div>

        {/* Redirect Prompt */}
        <RedirectPrompt />

        {/* Number display area */}
        <NumberDisplay
          isGenerating={isGenerating}
          targetNumber={targetNumber}
          matchupId={matchupId}
          onAnimationComplete={handleAnimationComplete}
        />

        {/* History section */}
        {generationHistory.length > 0 && !isGenerating && (
          <div className="mb-8">
            <h3 className="text-white text-center text-sm mb-4 font-semibold">
              Recent Numbers
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {generationHistory.slice(0, 5).map((num, index) => (
                <div
                  key={index}
                  className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-semibold"
                >
                  {num.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard section */}
        {leaderboard &&
          Array.isArray(leaderboard) &&
          leaderboard.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white text-center text-lg mb-4 font-semibold">
                Leaderboard
              </h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-h-48 overflow-y-auto">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.userId}
                    className="flex items-center justify-between py-3 px-4 mb-2 last:mb-0 bg-white/10 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white font-semibold">
                        {player.displayName}
                      </span>
                    </div>
                    <div className="text-white font-bold">
                      {player.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Delete Bindings button - Fixed at bottom left */}
      <div className="fixed bottom-8 left-4 z-30">
        <button
          onClick={handleDeleteBindings}
          disabled={isDeletingBindings}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-full shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <i className="ri-delete-bin-line text-xs"></i>
          <span className="text-xs font-medium">
            {isDeletingBindings ? "Deleting..." : "Delete Bindings"}
          </span>
        </button>
      </div>

      {/* Generate button - Fixed at bottom */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <button
          onClick={generateNumber}
          disabled={isGenerating}
          className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full shadow-2xl hover:shadow-primary/25 transform hover:scale-110 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed !rounded-button flex items-center justify-center"
        >
          <div className="text-center">
            <i className="ri-dice-line text-white text-2xl mb-1"></i>
            <div className="text-white text-xs font-bold">Generate</div>
          </div>
        </button>
      </div>
    </div>
  );
}
