"use client";
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    role: "user",
  });

  useEffect(() => {
    if (session?.user) {
      setUserProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "user",
      });
    }
  }, [session]);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userProfile.name,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setEditing(false);
        
        // Update the session with new user data
        await signOut({callbackUrl: "/auth/signin"})
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
    // Reset form to original values
    if (session?.user) {
      setUserProfile({
        name: session.user.name || "",
        email: session.user.email || "",
        role: session.user.role || "user",
      });
    }
  };

  const battingStyles = [
    "Right-handed",
    "Left-handed"
  ];

  const bowlingStyles = [
    "Right-arm fast",
    "Right-arm medium-fast",
    "Right-arm medium",
    "Right-arm spin",
    "Left-arm fast",
    "Left-arm medium-fast",
    "Left-arm medium",
    "Left-arm spin",
    "Does not bowl"
  ];

  const positions = [
    "Batsman",
    "Bowler",
    "All-rounder",
    "Wicket-keeper",
    "Wicket-keeper Batsman",
    "Captain"
  ];

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <Link href="/" className="mb-4 flex items-center text-blue-100 hover:text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold mb-2">My Profile</h1>
              <p className="text-blue-100">Manage your profile and details</p>
            </div>
            <button
              onClick={() => editing ? handleCancel() : setEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-900/50 border border-green-700 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-300 text-sm">{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6 text-center">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-1">
              {userProfile.name || "Cricket Player"}
            </h2>
            <p className="text-slate-400 capitalize">{userProfile.role}</p>
          </div>

          {/* Basic Information */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className={`${!editing ? "flex items-center space-x-2" : ""}`}>
                <label className="block text-sm font-medium text-slate-200 ">Full Name:</label>
                {editing ? (
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                ) : (
                  <p className="text-slate-300">{userProfile.name || "Not provided"}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-slate-200">Email:</label>
                <p className="text-slate-300">{userProfile.email}</p>
                <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>
              </div>

              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-slate-200">Role:</label>
                <p className="text-slate-300 capitalize">{userProfile.role}</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {editing && (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={loading || !userProfile.name.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}