"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getNavigation } from "../lib/lucraClient";

interface RedirectContextType {
  redirectUrl: string | null;
  setRedirectUrl: (url: string | null) => void;
  showRedirectPrompt: boolean;
  setShowRedirectPrompt: (show: boolean) => void;
  handleRedirectResponse: (accept: boolean) => void;
}

const RedirectContext = createContext<RedirectContextType | null>(null);

export const RedirectProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [redirectUrl, setRedirectUrlState] = useState<string | null>(null);
  const [showRedirectPrompt, setShowRedirectPrompt] = useState(false);

  // Check for redirect URL param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get("redirect");
      
      if (redirectParam) {
        setRedirectUrlState(redirectParam);
        setShowRedirectPrompt(true);
        console.log("!!!: RedirectProvider: Found redirect URL:", redirectParam);
      }
    }
  }, []);

  const setRedirectUrl = (url: string | null) => {
    setRedirectUrlState(url);
    if (url) {
      setShowRedirectPrompt(true);
    }
  };

  const handleRedirectResponse = (accept: boolean) => {
    if (accept && redirectUrl) {
      // Get the navigation instance (this will open the iframe if needed)
      const navigation = getNavigation();
      if (navigation) {
        navigation.deepLink(redirectUrl);
      }
    }
    setShowRedirectPrompt(false);
    // Keep the redirectUrl in memory, just hide the prompt
  };

  return (
    <RedirectContext.Provider
      value={{
        redirectUrl,
        setRedirectUrl,
        showRedirectPrompt,
        setShowRedirectPrompt,
        handleRedirectResponse,
      }}
    >
      {children}
    </RedirectContext.Provider>
  );
};

export const useRedirect = () => {
  const context = useContext(RedirectContext);
  if (!context) {
    throw new Error("useRedirect must be used within a RedirectProvider");
  }
  return context;
};