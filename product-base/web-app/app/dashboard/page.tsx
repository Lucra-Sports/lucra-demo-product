
'use client';

import { useState } from 'react';
import Link from 'next/link';
import NumberDisplay from '../../components/NumberDisplay';

export default function Dashboard() {
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<number[]>([]);

  const generateNumber = () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    // Ensure truly random distribution from 1 to 1,000,000 inclusive
    const targetNumber = Math.floor(Math.random() * 1000000) + 1;
    
    setCurrentNumber(targetNumber);
    setGenerationHistory(prev => [targetNumber, ...prev.slice(0, 9)]);
  };

  const handleAnimationComplete = () => {
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 relative overflow-hidden">
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
          <h1 className="font-[\'Pacifico\'] text-6xl text-white mb-4 drop-shadow-lg">RNG</h1>
          <p className="text-white/80 text-lg">Your Random Number Generator</p>
        </div>

        {/* Number display area */}
        <NumberDisplay 
          number={currentNumber} 
          isAnimating={isGenerating}
          onAnimationComplete={handleAnimationComplete}
        />

        {/* History section */}
        {generationHistory.length > 0 && !isGenerating && (
          <div className="mb-8">
            <h3 className="text-white text-center text-lg mb-4 font-semibold">Recent Numbers</h3>
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
          className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-2xl hover:shadow-yellow-500/25 transform hover:scale-110 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed !rounded-button flex items-center justify-center"
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
