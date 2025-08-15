"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NumberDisplay from "../../components/NumberDisplay";
import { generateNumber as fetchNumber, getCurrentUser, getBindings, deleteBindings } from "../../lib/api";
import { useRouter } from "next/navigation";
import { getNavigation, updateUser } from "../../lib/lucraClient";
import RedirectPrompt from "../../components/RedirectPrompt";
import LucraInitializer from "../lucraInitializer";

export default function Dashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<number[]>([]);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [isDeletingBindings, setIsDeletingBindings] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else {
      console.log("!!!: RNG: Dashboard - user:", user);
      // Update user in Lucra when dashboard loads
      updateUser(user);
      
      // Fetch bindings when dashboard loads
      getBindings()
        .then((bindings) => {
          console.log("!!!: RNG: Dashboard - fetched bindings:", bindings);
        })
        .catch((error) => {
          console.error("RNG: Dashboard - failed to fetch bindings:", error);
        });
    }
  }, [router, user]);

  const generateNumber = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setTargetNumber(null);
    try {
      const num = await fetchNumber();
      setTargetNumber(num);
    } catch (err: any) {
      alert(err.message || "Failed to generate number");
      setIsGenerating(false);
    }
  };

  const handleAnimationComplete = (finalNumber: number) => {
    setIsGenerating(false);
    setGenerationHistory((prev) => [finalNumber, ...prev.slice(0, 9)]);
  };

  const handleChallegeOpponent = () => {
    getNavigation()?.createMatchup();
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
      {/* This would need to be available on sign up / sign in to RNG, which we currently do not collect */}
      <LucraInitializer
        userPhoneNumber={process.env.NEXT_PUBLIC_MOCK_PHONE_NUMBER}
      />
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
          <h1 className="font-['Pacifico'] text-6xl text-white mb-4 drop-shadow-lg">
            RNG
          </h1>
          <p className="text-white/80 text-lg">Your Random Number Generator</p>
        </div>

        {/* Redirect Prompt */}
        <RedirectPrompt />

        <button
          onClick={handleChallegeOpponent}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 !rounded-button mb-4"
        >
          <i className="ri-sword-line mr-2"></i>
          Challenge Opponent in Lucra
        </button>

        <button
          onClick={handleDeleteBindings}
          disabled={isDeletingBindings}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-2xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 !rounded-button disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <i className="ri-delete-bin-line mr-2"></i>
          {isDeletingBindings ? "Deleting..." : "Delete Bindings"}
        </button>

        {/* Number display area */}
        <NumberDisplay
          isGenerating={isGenerating}
          targetNumber={targetNumber}
          onAnimationComplete={handleAnimationComplete}
        />

        {/* History section */}
        {generationHistory.length > 0 && !isGenerating && (
          <div className="mb-8">
            <h3 className="text-white text-center text-lg mb-4 font-semibold">
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
