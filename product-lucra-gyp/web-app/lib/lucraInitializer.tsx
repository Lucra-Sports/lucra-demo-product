"use client";
import { initLucraClient } from "@/lib/lucraClient";
import { useEffect, useRef } from "react";

export const LucraInitializer = () => {
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return;

    hasInitialized.current = true;
    initLucraClient(process.env.NEXT_PUBLIC_MOCK_PHONE_NUMBER || "");
  }, []);

  return null;
};
