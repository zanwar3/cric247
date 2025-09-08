"use client";
import { useState, useEffect } from "react";
import MobileLayout from "@/components/MobileLayout";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    captain: "",
    coach: "",
    founded: "",
    homeGround: "",
    description: "",
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTeam ? `/api/teams/${editingTeam._id}` : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          name: "",
          city: "",
          captain: "",
          coach: "",
          founded: "",
          homeGround: "",
          description: "",
        });
        setShowForm(false);
        setEditingTeam(null);
        fetchTeams();
        alert(editingTeam ? "Team updated successfully!" : "Team created successfully!");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to save team");
      }
    } catch (error) {
      console.error("Error saving team:", error);
      alert("Failed to save team. Please try again.");
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name || "",
      city: team.city || "",
      captain: team.captain || "",
      coach: team.coach || "",
      founded: team.founded || "",
      homeGround: team.homeGround || "",
      description: team.description || "",
    });
    setShowForm(true);
    setActiveTab("form");
  };

  const handleDelete = async () => {
    if (!teamToDelete) return;
    
    try {
      const response = await fetch(`/api/teams/${teamToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTeams();
        setShowDeleteDialog(false);
        setTeamToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  const openDeleteDialog = (team) => {
    setTeamToDelete(team);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
              <p className="text-slate-300 mt-4">Loading teams...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Teams</h1>
            <p className="text-slate-300 text-sm sm:text-base">Manage your cricket teams</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              All Teams
            </button>
            <button
              onClick={() => setActiveTab("form")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "form"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              {editingTeam ? "Edit Team" : "Add Team"}
            </button>
          </div>

          {/* Content */}
          {activeTab === "list" && (
            <div>
              {teams.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">No teams yet</h3>
                  <p className="text-slate-400 mb-4">Get started by creating your first team</p>
                  <button
                    onClick={() => {
                      setActiveTab("form");
                      setEditingTeam(null);
                      setFormData({
                        name: "",
                        city: "",
                        captain: "",
                        coach: "",
                        founded: "",
                        homeGround: "",
                        description: "",
                      });
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Team
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6">
                  {teams.map((team) => (
                    <TeamCard
                      key={team._id}
                      team={team}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "form" && (
            <TeamForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              editingTeam={editingTeam}
              onCancel={() => {
                setShowForm(false);
                setEditingTeam(null);
                setActiveTab("list");
                setFormData({
                  name: "",
                  city: "",
                  captain: "",
                  coach: "",
                  founded: "",
                  homeGround: "",
                  description: "",
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
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Delete Team</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete {teamToDelete?.name}? This action cannot be undone.
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

function TeamCard({ team, onEdit, onDelete }) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {team.name?.charAt(0)?.toUpperCase() || "T"}
              </span>
            </div>
            <div>
              <h3 className="text-slate-100 font-semibold">{team.name || "Unnamed Team"}</h3>
              <p className="text-slate-300 text-sm">{team.city || "City not specified"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Team Details */}
        <div className="grid grid-cols-2 gap-3">
          {team.captain && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-slate-300 text-sm">Captain: {team.captain}</span>
            </div>
          )}
          {team.coach && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-slate-300 text-sm">Coach: {team.coach}</span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3">
          {team.founded && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-300 text-sm">Founded: {team.founded}</span>
            </div>
          )}
          {team.homeGround && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-slate-300 text-sm">Home: {team.homeGround}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {team.description && (
          <div className="pt-2">
            <p className="text-slate-300 text-sm">{team.description}</p>
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      <div className="bg-slate-700 px-4 py-3 border-t border-slate-600">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEdit(team)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(team)}
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

function TeamForm({ formData, setFormData, onSubmit, editingTeam, onCancel }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">
        {editingTeam ? "Edit Team" : "Create New Team"}
      </h2>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Team Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Team name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="City"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Captain</label>
            <input
              type="text"
              name="captain"
              value={formData.captain}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Team captain"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Coach</label>
            <input
              type="text"
              name="coach"
              value={formData.coach}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Team coach"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Founded Year</label>
            <input
              type="number"
              name="founded"
              value={formData.founded}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Year founded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Home Ground</label>
            <input
              type="text"
              name="homeGround"
              value={formData.homeGround}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Home ground"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Team description"
          />
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            {editingTeam ? "Update Team" : "Create Team"}
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
