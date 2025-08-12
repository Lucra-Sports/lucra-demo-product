"use client";

import { useState, useEffect } from "react";
import { useLucraClient } from "../../hooks/useLucraClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, getStats, updateProfile } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const {
    navigateToProfile,
    navigateToHome,
    navigateToDeposit,
    navigateToWithdraw,
  } = useLucraClient();
  const [user, setUser] = useState(getCurrentUser());
  const [stats, setStats] = useState({
    totalNumbersGenerated: 0,
    bestNumber: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    birthday: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setFormData({
      full_name: user.full_name,
      email: user.email,
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      zip_code: user.zip_code || "",
      birthday: user.birthday || "",
    });
    getStats()
      .then(setStats)
      .catch(() => {});
  }, [router, user]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateProfile(formData);
      setUser(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLucra = () => {
    console.log("Lucra button clicked!");
    navigateToProfile();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between p-6">
          <Link
            href="/dashboard"
            className="text-white hover:text-white/80 transition-colors"
          >
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
            <div className="w-24 h-24 bg-gradient-to-r from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
              <i className="ri-user-line text-white text-4xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {user.full_name}
            </h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 text-center text-white">
              <div className="text-2xl font-bold">
                {stats.totalNumbersGenerated}
              </div>
              <div className="text-sm opacity-90">Numbers Generated</div>
            </div>
            <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 text-center text-white">
              <div className="text-lg font-bold">
                {stats.bestNumber.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Best Number</div>
            </div>
          </div>

          {isEditing && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                  required
                />
              </div>
              <input
                type="text"
                name="zip_code"
                placeholder="ZIP Code"
                value={formData.zip_code}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                required
              />
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                required
              />
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-2xl font-semibold hover:from-primary hover:to-secondary transition-all duration-300 !rounded-button disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </form>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleLucra}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 !rounded-button"
          >
            <i className="ri-star-line mr-2"></i>
            Lucra Profile
          </button>

          <button
            onClick={() => navigateToHome()}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all duration-300 !rounded-button"
          >
            <i className="ri-home-line mr-2"></i>
            Lucra Home
          </button>

          <button
            onClick={navigateToDeposit}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 !rounded-button"
          >
            <i className="ri-money-dollar-circle-line mr-2"></i>
            Lucra Deposit
          </button>

          <button
            onClick={navigateToWithdraw}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-2xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-300 !rounded-button"
          >
            <i className="ri-bank-card-line mr-2"></i>
            Lucra Withdraw
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-2xl font-semibold hover:from-primary hover:to-secondary transition-all duration-300 !rounded-button"
          >
            <i className="ri-settings-line mr-2"></i>
            {isEditing ? "Cancel" : "Update Profile Settings"}
          </button>

          <Link
            href="/history"
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-2xl font-semibold hover:from-primary hover:to-secondary transition-all duration-300 !rounded-button flex items-center justify-center"
          >
            <i className="ri-history-line mr-2"></i>
            Number History
          </Link>

          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 rounded-2xl font-semibold hover:from-primary hover:to-secondary transition-all duration-300 !rounded-button"
          >
            <i className="ri-logout-box-line mr-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
