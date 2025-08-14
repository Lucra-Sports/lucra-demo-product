"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { setLucraJourneyTracker } from "../lib/lucraClient";

export const LucraJourneyContext = createContext<{
  lucraJourney: string[];
  trackLucraUrl: (url: string) => void;
}>(null!);

// This context is used to give insight to the user journey within the Lucra app.
export const LucraJourneyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [lucraJourney, setLucraJourney] = useState<string[]>([]);

  const trackLucraUrl = (url: string) => {
    setLucraJourney((prev) => [...prev, url]);
  };

  // Register the tracking function with lucraClient
  useEffect(() => {
    setLucraJourneyTracker(trackLucraUrl);
  }, []);

  return (
    <LucraJourneyContext.Provider value={{ lucraJourney, trackLucraUrl }}>
      {children}
    </LucraJourneyContext.Provider>
  );
};

export function useLucraJourney() {
  const context = useContext(LucraJourneyContext);
  if (context === undefined) {
    throw new Error("useUserJourney must be used within a UserJourneyProvider");
  }
  return context;
}
