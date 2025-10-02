"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState(null);

  const [formData, setFormData] = useState({
    matchNumber: "",
    team1: "",
    team2: "",
    venue: "",
    city: "",
    date: "",
    time: "",
    matchType: "T20",
    status: "Scheduled",
    notes: ""
  });

  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      const data = await response.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingMatch ? `/api/matches/${editingMatch._id}` : "/api/matches";
      const method = editingMatch ? "PUT" : "POST";

      const matchData = {
        matchNumber: formData.matchNumber,
        teams: {
          teamA: formData.team1,
          teamB: formData.team2
        },
        venue: {
          name: formData.venue,
          city: formData.city
        },
        scheduledDate: new Date(`${formData.date}T${formData.time}`),
        matchType: formData.matchType,
        status: formData.status,
        notes: formData.notes
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchData),
      });

      if (response.ok) {
        setFormData({
          matchNumber: "",
          team1: "",
          team2: "",
          venue: "",
          city: "",
          date: "",
          time: "",
          matchType: "T20",
          status: "Scheduled",
          notes: ""
        });
        setShowForm(false);
        setEditingMatch(null);
        setActiveTab("list");
        fetchMatches();

      } else {
        const errorData = await response.json();
      }
    } catch (error) {
      console.error("Error saving match:", error);
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    const matchDate = new Date(match.scheduledDate);
    setFormData({
      matchNumber: match.matchNumber || "",
      team1: match.teams?.teamA || "",
      team2: match.teams?.teamB || "",
      venue: match.venue?.name || "",
      city: match.venue?.city || "",
      date: matchDate.toISOString().split('T')[0],
      time: matchDate.toTimeString().slice(0,5),
      matchType: match.matchType || "T20",
      status: match.status || "Scheduled",
      notes: match.notes || ""
    });
    setShowForm(true);
    setActiveTab("form");
  };

  const handleDelete = async () => {
    if (!matchToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/matches/${matchToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMatches();
        setShowDeleteDialog(false);
        setMatchToDelete(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete match");
      }
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Failed to delete match. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t._id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "live":
        return "bg-red-600 text-white";
      case "completed":
        return "bg-green-600 text-white";
      case "cancelled":
        return "bg-gray-600 text-white";
      case "postponed":
        return "bg-yellow-600 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading matches...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center text-green-100 hover:text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <div className="flex space-x-2">
              {/*<Link*/}
              {/*  href="/score/demo"*/}
              {/*  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"*/}
              {/*>*/}
              {/*  Demo Scoring*/}
              {/*</Link>*/}
              <Link
                href="/create-match"
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Quick Create
              </Link>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Matches Management</h1>
          <p className="text-green-100">Create, manage and track all your cricket matches</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab("list");
                setShowForm(false);
                setEditingMatch(null);
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "list"
                  ? "text-green-400 border-b-2 border-green-400 bg-slate-700"
                  : "text-slate-300 hover:text-slate-100"
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              All Matches ({matches.length})
            </button>
            <Link href='/create-match'
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "form"
                  ? "text-green-400 border-b-2 border-green-400 bg-slate-700"
                  : "text-slate-300 hover:text-slate-100"
              }`}
            >
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {editingMatch ? "Edit Match" : "Create Match"}
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Matches List */}
          {activeTab === "list" && (
            <div>
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">No Matches Yet</h3>
                  <p className="text-slate-400 mb-6">Create your first match to get started with cricket management.</p>
                  <Link href="/create-match"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create First Match
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      onEdit={handleEdit}
                      onDelete={(match) => {
                        setMatchToDelete(match);
                        setShowDeleteDialog(true);
                      }}
                      getTeamName={getTeamName}
                      getStatusColor={getStatusColor}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Match Form */}
          {activeTab === "form" && (
            <MatchForm
              formData={formData}
              setFormData={setFormData}
              teams={teams}
              editingMatch={editingMatch}
              onSubmit={handleSubmit}
              onCancel={() => {
                setActiveTab("list");
                setShowForm(false);
                setEditingMatch(null);
              }}
            />
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <DeleteDialog
            match={matchToDelete}
            onConfirm={handleDelete}
            deleteLoading={deleteLoading}
            onCancel={() => {
              setShowDeleteDialog(false);
              setMatchToDelete(null);
            }}
          />
        )}
      </div>
    </MobileLayout>
  );
}

// Match Card Component
function MatchCard({ match, onEdit, onDelete, getTeamName, getStatusColor, formatDate }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Match Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(match.status)}`}>
              {match.status?.toUpperCase() || "SCHEDULED"}
            </span>
            <span className="text-slate-400 text-sm">{match.matchType || "T20"}</span>
          </div>
          {match?.tournament && <span className="text-slate-400 text-xs">
            {match?.tournament?.name}
          </span>}
          <span className="text-slate-400 text-xs">
            {formatDate(match.scheduledDate)}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-100">
          {match.matchNumber || `${getTeamName(match.teams?.teamA)} vs ${getTeamName(match.teams?.teamB)}`}
        </h3>
        {match.venue?.name && (
          <p className="text-slate-400 text-sm mt-1">
            📍 {match.venue.name}, {match.venue.city}
          </p>
        )}
      </div>

      {/* Match Details */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <div className="text-slate-100 font-semibold">{getTeamName(match.teams?.teamA)}</div>
            <div className="text-slate-400 text-sm">Team A</div>
          </div>
          <div className="px-4 text-slate-400 text-lg font-bold">VS</div>
          <div className="text-center flex-1">
            <div className="text-slate-100 font-semibold">{getTeamName(match.teams?.teamB)}</div>
            <div className="text-slate-400 text-sm">Team B</div>
          </div>
        </div>

        {match.notes && (
          <div className="bg-slate-700 rounded-lg p-3 mb-4">
            <p className="text-slate-300 text-sm">{match.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onEdit(match)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Edit
          </button>
          {match.status === 'Live' && <Link
            href={match.status === "Live" ? `/score/${match._id}` : "#"}
            className={`py-2 px-3 rounded-lg text-sm font-medium text-center transition-colors
             ${match.status === "Live"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-400 cursor-not-allowed text-white pointer-events-none"
            }`}
          >
            Score
          </Link>}
          <button
            onClick={() => onDelete(match)}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Match Form Component
function MatchForm({ formData, setFormData, teams, editingMatch, onSubmit, onCancel }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-100 mb-6">
        {editingMatch ? "Edit Match" : "Create New Match"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Match Title
              </label>
              <input
                type="text"
                value={formData.matchNumber}
                onChange={(e) => setFormData({ ...formData, matchNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400"
                placeholder="e.g., League Match 1, Final, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Match Type
                </label>
                <select
                  value={formData.matchType}
                  onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                >
                  <option value="T10">T10</option>
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                  <option value="Practice">Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Postponed">Postponed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Teams</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Team A
              </label>
              <select
                value={formData.team1}
                onChange={(e) => setFormData({ ...formData, team1: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                required
              >
                <option value="">Select Team A</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Team B
              </label>
              <select
                value={formData.team2}
                onChange={(e) => setFormData({ ...formData, team2: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                required
              >
                <option value="">Select Team B</option>
                {teams.filter(team => team._id !== formData.team1).map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Venue & Schedule */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Venue & Schedule</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400"
                  placeholder="Stadium name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400"
                  placeholder="City, State"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 h-20 resize-none"
                placeholder="Additional match details or notes..."
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {editingMatch ? "Update Match" : "Create Match"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Delete Dialog Component
function DeleteDialog({ match, onConfirm, onCancel, deleteLoading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Delete Match</h3>
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete "{match?.matchNumber || 'this match'}"? This action cannot be undone.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={onConfirm}
            disabled={deleteLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {deleteLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </div>
            ) : (
              "Delete"
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={deleteLoading}
            className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-200 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
