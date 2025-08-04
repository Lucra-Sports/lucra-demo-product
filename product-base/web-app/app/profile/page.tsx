
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    birthday: '1990-05-15',
    totalGenerations: 47,
    bestNumber: 987654
  });

  const handleLogout = () => {
    // Clear authentication state
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('user_email');
    // Redirect to login page
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between p-6">
          <Link href="/dashboard" className="text-white hover:text-white/80 transition-colors">
            <i className="ri-arrow-left-line text-2xl"></i>
          </Link>
          <h1 className="font-['Pacifico'] text-2xl text-white">Profile</h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="ri-user-line text-white text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 text-center text-white">
              <div className="text-2xl font-bold">{user.totalGenerations}</div>
              <div className="text-sm opacity-90">Numbers Generated</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-center text-white">
              <div className="text-lg font-bold">{user.bestNumber.toLocaleString()}</div>
              <div className="text-sm opacity-90">Best Number</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/profile/settings" className="block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 !rounded-button text-center">
            <i className="ri-settings-line mr-2"></i>
            Update Profile Settings
          </Link>
          
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 !rounded-button">
            <i className="ri-history-line mr-2"></i>
            Number History
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 rounded-2xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 !rounded-button"
          >
            <i className="ri-logout-box-line mr-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
