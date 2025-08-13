
'use client';

import { useEffect, useState, useRef } from 'react';

interface NumberDisplayProps {
  isGenerating: boolean;
  targetNumber: number | null;
  onAnimationComplete?: (finalNumber: number) => void;
}

export default function NumberDisplay({ isGenerating, targetNumber, onAnimationComplete }: NumberDisplayProps) {
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentAnimatedNumber, setCurrentAnimatedNumber] = useState(0);
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isGenerating && targetNumber !== null) {
      // Reset state when starting new generation
      setShowFinalMessage(false);
      setDisplayNumber(null);
      setCurrentAnimatedNumber(0);
      setIsVisible(false);
      startNumberAnimation(targetNumber);
    } else if (!isGenerating && !isVisible) {
      // Reset state when not generating
      setCurrentAnimatedNumber(0);
      setShowFinalMessage(false);
      setDisplayNumber(null);
    }
  }, [isGenerating, targetNumber]);

  const startNumberAnimation = (target: number) => {
    setIsVisible(true);
    setCurrentAnimatedNumber(1);
    
    const startTime = Date.now();
    const duration = 5000; // 5 seconds total duration
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth acceleration and deceleration curve
      // This creates a smooth curve that starts slow, speeds up, then slows down
      const easeValue = progress * progress * (3 - 2 * progress); // Smoothstep function
      
      const currentValue = Math.floor(1 + (target - 1) * easeValue);
      setCurrentAnimatedNumber(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure we land exactly on the target number
        setCurrentAnimatedNumber(target);
        setDisplayNumber(target);
        setShowFinalMessage(true);
        setTimeout(() => {
          onAnimationComplete?.(target);
        }, 800);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-white/60 text-xl text-center">Press the button to generate a number!</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white/80">
          <div className={`text-8xl font-bold mb-4 transform transition-all duration-200 ${
            isGenerating ? 'scale-110 animate-pulse' : 'scale-100'
          }`}>
            {currentAnimatedNumber.toLocaleString()}
          </div>
        </div>
        
        {showFinalMessage && (
          <div className="text-white/80 text-lg mb-4 animate-bounce">Your Lucky Number!</div>
        )}
        
        {isGenerating && (
          <div className="text-white/60 text-sm animate-pulse">Generating...</div>
        )}
      </div>
    </div>
  );
}
