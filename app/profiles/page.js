"use client";
import { useState, useEffect } from "react";
import MobileLayout from "@/components/MobileLayout";
import Loader from "@/components/Loader";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    role: "",
    battingStyle: "",
    bowlingStyle: "",
    experience: "",
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profiles");
      const data = await response.json();
      setProfiles(data);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true)
      const url = editingProfile ? `/api/profiles/${editingProfile._id}` : "/api/profiles";
      const method = editingProfile ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          age: "",
          role: "",
          battingStyle: "",
          bowlingStyle: "",
          experience: "",
        });
        setShowForm(false);
        setEditingProfile(null);
        setCreateLoading(false)
        setActiveTab("list");
        fetchProfiles();

      }
    } catch (error) {
      console.error("Error saving profile:", error);
    }finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || "",
      age: profile.age || "",
      role: profile.role || "",
      battingStyle: profile.battingStyle || "",
      bowlingStyle: profile.bowlingStyle || "",
      experience: profile.experience || "",
    });
    setShowForm(true);
    setActiveTab("form");
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;

    try {
      const response = await fetch(`/api/profiles/${profileToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchProfiles();
        setShowDeleteDialog(false);
        setProfileToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  const openDeleteDialog = (profile) => {
    setProfileToDelete(profile);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-slate-300 mt-4">Loading profiles...</p>
            </div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Player Profiles</h1>
            <p className="text-slate-300 text-sm sm:text-base">Manage your cricket player profiles</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              All Profiles
            </button>
            <button
              onClick={() => setActiveTab("form")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "form"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              {editingProfile ? "Edit Profile" : "Add Profile"}
            </button>
          </div>

          {/* Content */}
          {activeTab === "list" && (
            <div>
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">No profiles yet</h3>
                  <p className="text-slate-400 mb-4">Get started by creating your first player profile</p>
                  <button
                    onClick={() => {
                      setActiveTab("form");
                      setEditingProfile(null);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        age: "",
                        role: "",
                        battingStyle: "",
                        bowlingStyle: "",
                        experience: "",
                      });
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Profile
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6">
                  {profiles.map((profile) => (
                    <ProfileCard
                      key={profile._id}
                      profile={profile}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "form" && (
            <ProfileForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              editingProfile={editingProfile}
              createLoading={createLoading}
              onCancel={() => {
                setShowForm(false);
                setEditingProfile(null);
                setActiveTab("list");
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  age: "",
                  role: "",
                  battingStyle: "",
                  bowlingStyle: "",
                  experience: "",
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Delete Profile</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete {profileToDelete?.name}? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 text-slate-300 hover:text-slate-100 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

function ProfileCard({ profile, onEdit, onDelete }) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {profile.name?.charAt(0)?.toUpperCase() || "P"}
              </span>
            </div>
            <div>
              <h3 className="text-slate-100 font-semibold">{profile.name || "Unnamed Player"}</h3>
              <p className="text-slate-300 text-sm">{profile.role || "Player"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-slate-300 text-sm break-all">{profile.email || "No email"}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-slate-300 text-sm">{profile.phone}</span>
            </div>
          )}
        </div>

        {/* Player Details */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {profile.age && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-slate-300 text-sm">{profile.age} years</span>
            </div>
          )}
          {profile.experience && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.815-8.864-2.245M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-slate-300 text-sm">{profile.experience} years</span>
            </div>
          )}
        </div>

        {/* Cricket Skills */}
        {(profile.battingStyle || profile.bowlingStyle) && (
          <div className="pt-2 space-y-2">
            {profile.battingStyle && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-slate-300 text-sm">Batting: {profile.battingStyle}</span>
              </div>
            )}
            {profile.bowlingStyle && (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-slate-300 text-sm">Bowling: {profile.bowlingStyle}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      <div className="bg-slate-700 px-4 py-3 border-t border-slate-600">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEdit(profile)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(profile)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ formData, setFormData, onSubmit, editingProfile, onCancel, createLoading }) {

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">
        {editingProfile ? "Edit Profile" : "Create New Profile"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Player name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="player@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Age"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select role</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-rounder">All-rounder</option>
              <option value="Wicket-keeper">Wicket-keeper</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Experience (years)</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Years of experience"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Batting Style</label>
            <select
              name="battingStyle"
              value={formData.battingStyle}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select batting style</option>
              <option value="Right-Handed">Right-handed</option>
              <option value="Left-Handed">Left-handed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Bowling Style</label>
            <select
              name="bowlingStyle"
              value={formData.bowlingStyle}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select bowling style</option>
              <option value="Fast">Fast</option>
              <option value="Medium">Medium</option>
              <option value="Spin">Spin</option>
              <option value="Leg-spin">Leg-spin</option>
              <option value="Off-spin">Off-spin</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors "
          >{
            createLoading ?
              <Loader text = "Saving..." />:
          editingProfile ? "Update Profile" : "Create Profile"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
