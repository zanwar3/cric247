"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
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
    try {
      // API call to update profile would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
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
              onClick={() => setEditing(!editing)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        </div>

        <div className="p-4">
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
            {/*{editing && (*/}
            {/*  <button className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors">*/}
            {/*    Change Profile Picture*/}
            {/*  </button>*/}
            {/*)}*/}
          </div>

          {/* Basic Information */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                  />
                ) : (
                  <p className="text-slate-300">{userProfile.name || "Not provided"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                <p className="text-slate-300">{userProfile.email}</p>
              </div>
            </div>
          </div>

          {/*/!* Cricket Information *!/*/}
          {/*<div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">*/}
          {/*  <h3 className="text-lg font-semibold text-slate-100 mb-4">Cricket Information</h3>*/}
          {/*  <div className="space-y-4">*/}
          {/*    <div>*/}
          {/*      <label className="block text-sm font-medium text-slate-200 mb-2">Playing Position</label>*/}
          {/*      {editing ? (*/}
          {/*        <select*/}
          {/*          value={userProfile.position}*/}
          {/*          onChange={(e) => setUserProfile({ ...userProfile, position: e.target.value })}*/}
          {/*          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"*/}
          {/*        >*/}
          {/*          {positions.map((position) => (*/}
          {/*            <option key={position} value={position.toLowerCase()}>{position}</option>*/}
          {/*          ))}*/}
          {/*        </select>*/}
          {/*      ) : (*/}
          {/*        <p className="text-slate-300 capitalize">{userProfile.position}</p>*/}
          {/*      )}*/}
          {/*    </div>*/}

          {/*    <div>*/}
          {/*      <label className="block text-sm font-medium text-slate-200 mb-2">Batting Style</label>*/}
          {/*      {editing ? (*/}
          {/*        <select*/}
          {/*          value={userProfile.battingStyle}*/}
          {/*          onChange={(e) => setUserProfile({ ...userProfile, battingStyle: e.target.value })}*/}
          {/*          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"*/}
          {/*        >*/}
          {/*          {battingStyles.map((style) => (*/}
          {/*            <option key={style} value={style.toLowerCase()}>{style}</option>*/}
          {/*          ))}*/}
          {/*        </select>*/}
          {/*      ) : (*/}
          {/*        <p className="text-slate-300 capitalize">{userProfile.battingStyle}</p>*/}
          {/*      )}*/}
          {/*    </div>*/}

          {/*    <div>*/}
          {/*      <label className="block text-sm font-medium text-slate-200 mb-2">Bowling Style</label>*/}
          {/*      {editing ? (*/}
          {/*        <select*/}
          {/*          value={userProfile.bowlingStyle}*/}
          {/*          onChange={(e) => setUserProfile({ ...userProfile, bowlingStyle: e.target.value })}*/}
          {/*          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"*/}
          {/*        >*/}
          {/*          {bowlingStyles.map((style) => (*/}
          {/*            <option key={style} value={style.toLowerCase()}>{style}</option>*/}
          {/*          ))}*/}
          {/*        </select>*/}
          {/*      ) : (*/}
          {/*        <p className="text-slate-300 capitalize">{userProfile.bowlingStyle}</p>*/}
          {/*      )}*/}
          {/*    </div>*/}

          {/*    <div>*/}
          {/*      <label className="block text-sm font-medium text-slate-200 mb-2">Bio</label>*/}
          {/*      {editing ? (*/}
          {/*        <textarea*/}
          {/*          value={userProfile.bio}*/}
          {/*          onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}*/}
          {/*          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 h-24 resize-none"*/}
          {/*          placeholder="Tell us about your cricket journey..."*/}
          {/*        />*/}
          {/*      ) : (*/}
          {/*        <p className="text-slate-300">{userProfile.bio || "No bio provided"}</p>*/}
          {/*      )}*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/* Recent Activity */}
          {/*<div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">*/}
          {/*  <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h3>*/}
          {/*  <div className="space-y-3">*/}
          {/*    <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">*/}
          {/*      <div className="w-2 h-2 bg-green-400 rounded-full"></div>*/}
          {/*      <div>*/}
          {/*        <p className="text-slate-200 text-sm">Created profile</p>*/}
          {/*        <p className="text-slate-400 text-xs">2 hours ago</p>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*    <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">*/}
          {/*      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>*/}
          {/*      <div>*/}
          {/*        <p className="text-slate-200 text-sm">Joined cricket app</p>*/}
          {/*        <p className="text-slate-400 text-xs">1 day ago</p>*/}
          {/*      </div>*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</div>*/}

          {/* Teams Created */}
          {/*<div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">*/}
          {/*  <h3 className="text-lg font-semibold text-slate-100 mb-4">Teams Created</h3>*/}
          {/*  <p className="text-slate-400 text-sm">You haven't created any teams yet.</p>*/}
          {/*  <Link*/}
          {/*    href="/teams"*/}
          {/*    className="inline-flex items-center mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"*/}
          {/*  >*/}
          {/*    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
          {/*      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />*/}
          {/*    </svg>*/}
          {/*    Create Your First Team*/}
          {/*  </Link>*/}
          {/*</div>*/}

          {/* Save Button */}
          {editing && (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Quick Actions */}
          {/*{!editing && (*/}
          {/*  <div className="grid grid-cols-2 gap-4 mt-6">*/}
          {/*    <Link*/}
          {/*      href="/my-cricket"*/}
          {/*      className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"*/}
          {/*    >*/}
          {/*      View Stats*/}
          {/*    </Link>*/}
          {/*    <Link*/}
          {/*      href="/past-matches"*/}
          {/*      className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"*/}
          {/*    >*/}
          {/*      Match History*/}
          {/*    </Link>*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      </div>
    </MobileLayout>
  );
}
