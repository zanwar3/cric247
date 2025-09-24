"use client";
import { useState, useEffect } from "react";
import MobileLayout from "@/components/MobileLayout";
import Loader from "@/components/Loader";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    venue: "",
    format: "",
    prizePool: "",
    description: "",
    status: "upcoming",
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tournaments");
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const url = editingTournament ? `/api/tournaments/${editingTournament._id}` : "/api/tournaments";
      const method = editingTournament ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          name: "",
          startDate: "",
          endDate: "",
          venue: "",
          format: "",
          prizePool: "",
          description: "",
          status: "upcoming",
        });
        setShowForm(false);
        setEditingTournament(null);
        setCreateLoading(false);
        setActiveTab("list");
        fetchTournaments();
      }
    } catch (error) {
      console.error("Error saving tournament:", error);
    }
  };

  const handleEdit = (tournament) => {
    console.log("ahmad",tournament);
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name || "",
      startDate: tournament.startDate || "",
      endDate: tournament.endDate || "",
      venue: tournament.venue || "",
      format: tournament.format || "",
      prizePool: tournament.prizePool || "",
      description: tournament.description || "",
      status: tournament.status || "upcoming",
    });
    setShowForm(true);
    setActiveTab("form");
  };

  const handleDelete = async () => {
    if (!tournamentToDelete) return;

    try {
      const response = await fetch(`/api/tournaments/${tournamentToDelete._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTournaments();
        setShowDeleteDialog(false);
        setTournamentToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting tournament:", error);
    }
  };

  const openDeleteDialog = (tournament) => {
    setTournamentToDelete(tournament);
    setShowDeleteDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-600";
      case "ongoing":
        return "bg-green-600";
      case "completed":
        return "bg-slate-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Ongoing";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
              <p className="text-slate-300 mt-4">Loading tournaments...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Tournaments</h1>
            <p className="text-slate-300 text-sm sm:text-base">Manage your cricket tournaments</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              All Tournaments
            </button>
            <button
              onClick={() => setActiveTab("form")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "form"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-slate-100 hover:bg-slate-700"
              }`}
            >
              {editingTournament ? "Edit Tournament" : "Add Tournament"}
            </button>
          </div>

          {/* Content */}
          {activeTab === "list" && (
            <div>
              {tournaments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-200 mb-2">No tournaments yet</h3>
                  <p className="text-slate-400 mb-4">Get started by creating your first tournament</p>
                  <button
                    onClick={() => {
                      setActiveTab("form");
                      setEditingTournament(null);
                      setFormData({
                        name: "",
                        startDate: "",
                        endDate: "",
                        venue: "",
                        format: "",
                        prizePool: "",
                        description: "",
                        status: "upcoming",
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Tournament
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6">
                  {tournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament._id}
                      tournament={tournament}
                      onEdit={handleEdit}
                      onDelete={openDeleteDialog}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "form" && (
            <TournamentForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              editingTournament={editingTournament}
              onCancel={() => {
                setShowForm(false);
                setEditingTournament(null);
                setActiveTab("list");
                setFormData({
                  name: "",
                  startDate: "",
                  endDate: "",
                  venue: "",
                  format: "",
                  prizePool: "",
                  description: "",
                  status: "upcoming",
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
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Delete Tournament</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete {tournamentToDelete?.name}? This action cannot be undone.
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

function TournamentCard({ tournament, onEdit, onDelete, getStatusColor, getStatusText }) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {tournament.name?.charAt(0)?.toUpperCase() || "T"}
              </span>
            </div>
            <div>
              <h3 className="text-slate-100 font-semibold">{tournament.name || "Unnamed Tournament"}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(tournament.status)}`}>
                  {getStatusText(tournament.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Tournament Details */}
        <div className="grid grid-cols-2 gap-3">
          {tournament.startDate && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-300 text-sm">Start: {new Date(tournament.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {tournament.endDate && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-300 text-sm">End: {new Date(tournament.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-3">
          {tournament.venue && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-slate-300 text-sm">Venue: {tournament.venue}</span>
            </div>
          )}
          {tournament.format && (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-slate-300 text-sm">Format: {tournament.format}</span>
            </div>
          )}
        </div>

        {/* Prize Pool */}
        {tournament.prizePool && (
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-slate-300 text-sm">Prize Pool: {tournament.prizePool}</span>
          </div>
        )}

        {/* Description */}
        {tournament.description && (
          <div className="pt-2">
            <p className="text-slate-300 text-sm">{tournament.description}</p>
          </div>
        )}
      </div>

      {/* Footer with Actions */}
      <div className="bg-slate-700 px-4 py-3 border-t border-slate-600">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEdit(tournament)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(tournament)}
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

function TournamentForm({ formData, setFormData, onSubmit, editingTournament, onCancel, createLoading }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-6">
        {editingTournament ? "Edit Tournament" : "Create New Tournament"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Tournament Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Tournament name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData?.startDate ? formData?.startDate?.split("T")[0] : ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData?.endDate ?  formData?.endDate?.split("T")[0] : ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Venue</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Tournament venue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Format</label>
            <select
              name="format"
              value={formData.format}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select format</option>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
              <option value="Test">Test</option>
              <option value="League">League</option>
              <option value="Knockout">Knockout</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Prize Pool</label>
          <input
            type="text"
            name="prizePool"
            value={formData.prizePool}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="e.g., $10,000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Tournament description"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            {  createLoading ? <Loader/>    :
              editingTournament ? "Update Tournament" : "Create Tournament"}
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
