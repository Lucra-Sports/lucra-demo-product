'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in on app launch
    const isLoggedIn = localStorage.getItem('user_logged_in');
    if (isLoggedIn === 'true') {
      router.push('/dashboard');
      return;
    }
    setIsCheckingAuth(false);
  }, [router]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
          <p className="text-white text-lg">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-12">
          <h1 className="font-['Pacifico'] text-8xl text-white mb-4 drop-shadow-2xl">RNG</h1>
          <p className="text-white/90 text-xl mb-8">Random Number Generator</p>
          <div className="w-32 h-1 bg-white/50 rounded-full mx-auto"></div>
        </div>

        <div className="space-y-4">
          <Link href="/auth/login">
            <button className="w-80 bg-white/20 backdrop-blur-sm text-white py-4 rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 transform hover:scale-105 !rounded-button border border-white/20">
              <i className="ri-login-box-line mr-2"></i>
              Login
            </button>
          </Link>

          <Link href="/auth/signup">
            <button className="w-80 bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-2xl font-semibold hover:from-primary hover:to-secondary transition-all duration-300 transform hover:scale-105 !rounded-button shadow-lg">
              <i className="ri-user-add-line mr-2"></i>
              Sign Up
            </button>
            </Link>
        </div>

        <div className="mt-12 text-white/70 text-sm">
          Generate random numbers from 1 to 1,000,000
        </div>
      </div>
    </div>
  );
}