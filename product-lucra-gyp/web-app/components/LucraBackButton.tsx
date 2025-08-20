"use client";

import { useState, useEffect } from "react";

export default function LucraBackButton() {
  const [isLucraVisible, setIsLucraVisible] = useState(false);

  useEffect(() => {
    // Watch for changes to the iframe container visibility
    const container = document.getElementById("lucra-iframe-container");
    if (!container) return;

    // Create observer to watch for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const hasOpacity0 = container.classList.contains("opacity-0");
          const hasPointerEvents = container.classList.contains("pointer-events-none");
          setIsLucraVisible(!hasOpacity0 && !hasPointerEvents);
        }
      });
    });

    // Start observing
    observer.observe(container, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Check initial state
    const hasOpacity0 = container.classList.contains("opacity-0");
    const hasPointerEvents = container.classList.contains("pointer-events-none");
    setIsLucraVisible(!hasOpacity0 && !hasPointerEvents);

    return () => observer.disconnect();
  }, []);

  const handleBackToRNG = () => {
    const container = document.getElementById("lucra-iframe-container");
    if (container) {
      container.classList.add("opacity-0", "pointer-events-none");
      container.classList.remove("opacity-100");
    }
  };

  if (!isLucraVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[10000]">
      <button
        onClick={handleBackToRNG}
        className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 backdrop-blur-sm bg-opacity-90"
      >
        <i className="ri-arrow-left-line text-sm"></i>
        <span className="text-sm font-medium">Back to RNG GYP</span>
      </button>
    </div>
  );
}