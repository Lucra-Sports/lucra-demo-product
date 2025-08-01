
'use client';

import { useEffect, useState, useRef } from 'react';

interface NumberDisplayProps {
  number: number | null;
  isAnimating: boolean;
  onAnimationComplete?: () => void;
}

export default function NumberDisplay({ number, isAnimating, onAnimationComplete }: NumberDisplayProps) {
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentAnimatedNumber, setCurrentAnimatedNumber] = useState(0);
  const [showFinalMessage, setShowFinalMessage] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (number !== null && isAnimating) {
      setShowFinalMessage(false);
      startNumberAnimation(number);
    } else if (!isAnimating && displayNumber === null && number === null) {
      setIsVisible(false);
      setCurrentAnimatedNumber(0);
      setShowFinalMessage(false);
    }
  }, [number, isAnimating]);

  const startNumberAnimation = (targetNumber: number) => {
    setIsVisible(true);
    setCurrentAnimatedNumber(1);
    setDisplayNumber(null);
    
    const startTime = Date.now();
    const duration = 4500; // Extended to 4.5 seconds for more suspense
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Enhanced easing function for more dramatic slowdown
      const easeOut = progress < 0.7 
        ? progress * 1.4  // Fast start for first 70%
        : 0.98 + (progress - 0.7) * 0.067; // Very slow finish for last 30%
      
      const currentValue = Math.floor(1 + (targetNumber - 1) * easeOut);
      setCurrentAnimatedNumber(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Final dramatic pause before showing the final number
        setTimeout(() => {
          setCurrentAnimatedNumber(targetNumber);
          setDisplayNumber(targetNumber);
          setShowFinalMessage(true);
          setTimeout(() => {
            onAnimationComplete?.();
          }, 800);
        }, 200);
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
        <div className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
          <div className={`text-8xl font-bold mb-4 transform transition-all duration-200 ${
            isAnimating ? 'scale-110 animate-pulse' : 'scale-100'
          }`}>
            {currentAnimatedNumber.toLocaleString()}
          </div>
        </div>
        
        {showFinalMessage && (
          <div className="text-white/80 text-lg mb-4 animate-bounce">Your Lucky Number!</div>
        )}
        
        {isAnimating && (
          <div className="text-white/60 text-sm animate-pulse">Generating...</div>
        )}
      </div>
    </div>
  );
}
