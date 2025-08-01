'use client';

interface LoadingAnimationProps {
  isVisible: boolean;
}

export default function LoadingAnimation({ isVisible }: LoadingAnimationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 flex flex-col items-center">
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-24 h-24 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-4 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full animate-bounce"></div>
          </div>
          
          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-1/2 -right-4 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <p className="text-gray-700 font-semibold mt-6 animate-pulse">Generating your lucky number...</p>
        
        {/* Animated dots */}
        <div className="flex space-x-1 mt-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}