"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function MyCricketPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    batting: {
      matches: 0,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      average: 0,
      strikeRate: 0,
      highestScore: 0,
      centuries: 0,
      fifties: 0
    },
    bowling: {
      matches: 0,
      overs: 0,
      runs: 0,
      wickets: 0,
      average: 0,
      economy: 0,
      bestFigures: "0/0",
      fiveWickets: 0
    },
    overall: {
      totalMatches: 0,
      wonMatches: 0,
      lostMatches: 0,
      tiedMatches: 0,
      winPercentage: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("batting");

  useEffect(() => {
    if (session?.user) {
      fetchUserStats();
    }
  }, [session]);

  const fetchUserStats = async () => {
    try {
      // This would fetch real stats from API
      // For now, using demo data
      setStats({
        batting: {
          matches: 25,
          runs: 1485,
          balls: 1120,
          fours: 145,
          sixes: 42,
          average: 62.29,
          strikeRate: 132.59,
          highestScore: 127,
          centuries: 2,
          fifties: 8
        },
        bowling: {
          matches: 18,
          overs: 82.3,
          runs: 647,
          wickets: 28,
          average: 23.11,
          economy: 7.85,
          bestFigures: "4/15",
          fiveWickets: 0
        },
        overall: {
          totalMatches: 25,
          wonMatches: 18,
          lostMatches: 6,
          tiedMatches: 1,
          winPercentage: 72
        }
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "batting", name: "Batting", icon: "🏏" },
    { id: "bowling", name: "Bowling", icon: "⚡" },
    { id: "overall", name: "Overall", icon: "📊" }
  ];

  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading your cricket stats...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6">
          <Link href="/" className="mb-4 flex items-center text-yellow-100 hover:text-white">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold mb-2">My Cricket</h1>
          <p className="text-yellow-100">Your personal cricket record and statistics</p>
        </div>

        <div className="p-4">
          {/* Player Profile Card */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {session?.user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-100">
                  {session?.user?.name || "Cricket Player"}
                </h3>
                <p className="text-slate-400">All-rounder</p>
                <div className="flex space-x-4 mt-2 text-sm">
                  <span className="text-green-400">{stats.overall.totalMatches} Matches</span>
                  <span className="text-blue-400">{stats.overall.winPercentage}% Win Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-yellow-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* Batting Stats */}
          {activeTab === "batting" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Batting Statistics</h3>
              
              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.batting.runs}</div>
                  <div className="text-slate-400 text-sm">Total Runs</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.batting.average.toFixed(2)}</div>
                  <div className="text-slate-400 text-sm">Average</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.batting.strikeRate.toFixed(2)}</div>
                  <div className="text-slate-400 text-sm">Strike Rate</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.batting.highestScore}</div>
                  <div className="text-slate-400 text-sm">Highest Score</div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Detailed Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Matches Played</span>
                    <span className="text-slate-100 font-semibold">{stats.batting.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Balls Faced</span>
                    <span className="text-slate-100 font-semibold">{stats.batting.balls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Boundaries</span>
                    <span className="text-slate-100 font-semibold">{stats.batting.fours} × 4s, {stats.batting.sixes} × 6s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Centuries</span>
                    <span className="text-slate-100 font-semibold">{stats.batting.centuries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Half Centuries</span>
                    <span className="text-slate-100 font-semibold">{stats.batting.fifties}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bowling Stats */}
          {activeTab === "bowling" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Bowling Statistics</h3>
              
              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-red-400">{stats.bowling.wickets}</div>
                  <div className="text-slate-400 text-sm">Wickets</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.bowling.average.toFixed(2)}</div>
                  <div className="text-slate-400 text-sm">Average</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.bowling.economy.toFixed(2)}</div>
                  <div className="text-slate-400 text-sm">Economy</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.bowling.bestFigures}</div>
                  <div className="text-slate-400 text-sm">Best Figures</div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Detailed Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Matches Bowled</span>
                    <span className="text-slate-100 font-semibold">{stats.bowling.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overs Bowled</span>
                    <span className="text-slate-100 font-semibold">{stats.bowling.overs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Runs Conceded</span>
                    <span className="text-slate-100 font-semibold">{stats.bowling.runs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Five-wicket Hauls</span>
                    <span className="text-slate-100 font-semibold">{stats.bowling.fiveWickets}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overall Stats */}
          {activeTab === "overall" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Overall Record</h3>
              
              {/* Win/Loss Record */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Match Record</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{stats.overall.wonMatches}</div>
                    <div className="text-slate-400 text-sm">Won</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.overall.lostMatches}</div>
                    <div className="text-slate-400 text-sm">Lost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.overall.tiedMatches}</div>
                    <div className="text-slate-400 text-sm">Tied/NR</div>
                  </div>
                </div>
                
                {/* Win Percentage Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Win Percentage</span>
                    <span className="text-slate-100 font-semibold">{stats.overall.winPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stats.overall.winPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Career Highlights */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Career Highlights</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl">🏏</div>
                    <div>
                      <div className="text-slate-100 font-medium">Highest Score</div>
                      <div className="text-slate-400 text-sm">{stats.batting.highestScore} runs vs Team XYZ</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <div className="text-slate-100 font-medium">Best Bowling</div>
                      <div className="text-slate-400 text-sm">{stats.bowling.bestFigures} vs Team ABC</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl">🏆</div>
                    <div>
                      <div className="text-slate-100 font-medium">Match Awards</div>
                      <div className="text-slate-400 text-sm">3 Player of the Match awards</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <Link
              href="/create-match"
              className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-medium text-center transition-colors"
            >
              Play New Match
            </Link>
            <Link
              href="/past-matches"
              className="block w-full bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium text-center transition-colors"
            >
              View Match History
            </Link>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
