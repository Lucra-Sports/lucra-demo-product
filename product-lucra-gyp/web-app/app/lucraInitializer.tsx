'use client';

import { useEffect } from 'react';
import { initLucraClient } from '../lib/lucraClient';

export default function LucraInitializer() {
  useEffect(() => {
    // Initialize Lucra client when component mounts (DOM is ready)
    initLucraClient();
  }, []);

  return null; // This component doesn't render anything
} 