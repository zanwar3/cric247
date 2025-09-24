"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function OngoingMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOngoingMatches();
  }, []);

  const fetchOngoingMatches = async () => {
    try {
      // Fetch matches with status 'live' or 'innings_break'
      const response = await fetch("/api/matches?status=live,innings_break");
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error("Error fetching ongoing matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-red-600 text-white";
      case "innings_break":
        return "bg-yellow-600 text-white";
      default:
        return "bg-slate-600 text-slate-300";
    }
  };

  const getMatchStatusText = (status) => {
    switch (status) {
      case "live":
        return "LIVE";
      case "innings_break":
        return "BREAK";
      default:
        return status.toUpperCase();
    }
  };

  const formatMatchTime = (date) => {
    return new Date(date).toLocaleString();
  };

  const getCurrentScore = (match) => {
    if (!match.innings || match.innings.length === 0) {
      return "Match not started";
    }

    const currentInnings = match.innings[match.innings.length - 1];
    return `${currentInnings.totalRuns}/${currentInnings.totalWickets} (${currentInnings.totalOvers}.${currentInnings.totalBalls % 6})`;
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading ongoing matches...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
          <Link href="/" className="mb-4 flex items-center text-orange-100 hover:text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold mb-2">Ongoing Matches</h1>
          <p className="text-orange-100">Continue or view live matches</p>
        </div>

        <div className="p-4">
          {matches.length === 0 ? (
            /* No Ongoing Matches */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-3">No Ongoing Matches</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                There are no live matches at the moment. Create a new match to get started with live scoring.
              </p>
              <div className="space-y-3">
                <Link
                  href="/create-match"
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Match
                </Link>
                <div className="block">
                  <Link
                    href="/score/demo"
                    className="inline-flex items-center px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors text-sm"
                  >
                    Try Demo Scoring
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Ongoing Matches List */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-100">
                  Live Matches ({matches.length})
                </h2>
                <button
                  onClick={fetchOngoingMatches}
                  className="text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {matches.map((match) => (
                <div key={match._id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  {/* Match Header */}
                  <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getMatchStatusColor(match.status)}`}>
                          {getMatchStatusText(match.status)}
                        </span>
                        <span className="text-slate-400 text-sm">{match.matchType}</span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {formatMatchTime(match.scheduledDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                          {match.matchNumber || `${match.teams?.teamA?.name || "Team A"} vs ${match.teams?.teamB?.name || "Team B"}`}
                        </h3>
                        {match.venue?.name && (
                          <p className="text-slate-400 text-sm mt-1">
                            📍 {match.venue.name}, {match.venue.city}
                          </p>
                        )}
                      </div>
                      <div>
                        {match.tournament && (
                          <>
                            <h3 className="text-lg font-semibold text-slate-100">
                              Tournament
                            </h3>
                            {match.venue?.name && (
                              <p className="text-slate-400 text-sm mt-1">
                                {match.tournament}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                    </div>


                  </div>

                  {/* Current Score */}
                  <div className="p-4">
                    <div className="bg-slate-700 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-400 mb-1">
                          {getCurrentScore(match)}
                        </div>
                        <div className="text-slate-300 text-sm">
                          Current Score
                        </div>
                      </div>
                    </div>

                    {/* Match Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/score/${match._id}`}
                        className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"
                      >
                        Continue Scoring
                      </Link>
                      <Link
                        href={`/matches/${match._id}`}
                        className="bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium text-center transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {match.innings && match.innings.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="bg-slate-700 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-slate-200 mb-2">Recent Activity</h4>
                        <div className="text-xs text-slate-400">
                          {match.status === "live" ? "Match in progress..." : "Innings break"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
