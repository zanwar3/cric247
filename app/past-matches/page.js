"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function PastMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPastMatches();
  }, [filter]);

  const fetchPastMatches = async () => {
    try {
      const response = await fetch(`/api/matches?status=completed&filter=${filter}`);
      const data = await response.json();
      setMatches(data || []);
    } catch (error) {
      console.error("Error fetching past matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchResult = (match) => {
    if (!match.result?.winner || !match.result?.resultText) {
      return "Result not available";
    }
    return match.result.resultText;
  };

  const getMatchWinner = (match) => {
    if (!match.result?.winner) return null;
    return match.teams?.teamA?._id === match.result.winner ? 
           match.teams?.teamA?.name : match.teams?.teamB?.name;
  };

  const getMatchDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlayerOfTheMatch = (match) => {
    return match.result?.playerOfTheMatch?.name || "Not awarded";
  };

  const filters = [
    { id: "all", name: "All Matches" },
    { id: "won", name: "Won" },
    { id: "lost", name: "Lost" },
    { id: "tied", name: "Tied/No Result" }
  ];

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading match history...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <Link href="/" className="mb-4 flex items-center text-purple-100 hover:text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold mb-2">Past Matches</h1>
          <p className="text-purple-100">View match history, scorecards and statistics</p>
        </div>

        <div className="p-4">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex space-x-2 overflow-x-auto">
              {filters.map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                    filter === filterOption.id
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {filterOption.name}
                </button>
              ))}
            </div>
          </div>

          {matches.length === 0 ? (
            /* No Past Matches */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-200 mb-3">No Match History</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                You haven't completed any matches yet. Start by creating and playing your first match!
              </p>
              <Link
                href="/create-match"
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Match
              </Link>
            </div>
          ) : (
            /* Past Matches List */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-100">
                  Match History ({matches.length})
                </h2>
                <button
                  onClick={fetchPastMatches}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
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
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          getMatchWinner(match) ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"
                        }`}>
                          {getMatchWinner(match) ? "WON" : "COMPLETED"}
                        </span>
                        <span className="text-slate-400 text-sm">{match.matchType}</span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {getMatchDate(match.scheduledDate)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {match.matchNumber || `${match.teams?.teamA?.name || "Team A"} vs ${match.teams?.teamB?.name || "Team B"}`}
                    </h3>
                    {match.venue?.name && (
                      <p className="text-slate-400 text-sm mt-1">
                        📍 {match.venue.name}, {match.venue.city}
                      </p>
                    )}
                  </div>

                  {/* Match Result */}
                  <div className="p-4">
                    <div className="bg-slate-700 rounded-lg p-4 mb-4">
                      <div className="text-center mb-3">
                        <div className="text-lg font-semibold text-green-400 mb-1">
                          {getMatchResult(match)}
                        </div>
                        {getMatchWinner(match) && (
                          <div className="text-slate-300 text-sm">
                            🏆 {getMatchWinner(match)} Won
                          </div>
                        )}
                      </div>

                      {/* Match Scores */}
                      {match.innings && match.innings.map((innings, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-t border-slate-600 first:border-t-0">
                          <span className="text-slate-300 font-medium">
                            {innings.battingTeam?.name || `Team ${index + 1}`}
                          </span>
                          <span className="text-slate-100 font-semibold">
                            {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers} overs)
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Player of the Match */}
                    {match.result?.playerOfTheMatch && (
                      <div className="bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span className="text-yellow-400 font-medium">Player of the Match:</span>
                          <span className="text-slate-100">{getPlayerOfTheMatch(match)}</span>
                        </div>
                      </div>
                    )}

                    {/* Match Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href={`/matches/${match._id}/scorecard`}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"
                      >
                        View Scorecard
                      </Link>
                      <Link
                        href={`/matches/${match._id}/stats`}
                        className="bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium text-center transition-colors"
                      >
                        Player Stats
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {matches.length > 0 && (
                <div className="text-center pt-6">
                  <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-6 rounded-lg font-medium transition-colors">
                    Load More Matches
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
