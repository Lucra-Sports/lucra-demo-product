"use client";

import { useEffect } from "react";
import { initLucraClient } from "../lib/lucraClient";

export default function LucraInitializer({
  userPhoneNumber = "",
}: {
  userPhoneNumber?: string;
}) {
  useEffect(() => {
    console.log("!!!: RNG: LucraInitializer: userPhoneNumber", userPhoneNumber);
    // Initialize Lucra client when component mounts (DOM is ready)
    initLucraClient(userPhoneNumber);
  }, [userPhoneNumber]);

  return null; // This component doesn't render anything
}
