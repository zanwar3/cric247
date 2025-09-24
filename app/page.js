"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import MobileLayout from "@/components/MobileLayout";

export default function Home() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    activeMatches: 0,
    totalMatches: 0,
    totalTeams: 0,
    totalPlayers: 0
  });

  useEffect(() => {
    // Fetch user statistics
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {

      const matches = await fetch("/api/matches");
      const matchesData = await matches.json();
      const totalMatches = matchesData.length;

      const teams = await fetch("/api/teams");
      const teamsData = await teams.json();
      const totalTeams = teamsData.length;

      const players = await fetch("/api/profiles");
      const playersData = await players.json();
      const totalPlayers = playersData.length;

      const activeMatches = matchesData.filter(match => match.status === "ongoing").length;
      // You can implement API calls to get real stats
      setStats({
        activeMatches: activeMatches,
        totalMatches: totalMatches,
        totalTeams: totalTeams,
        totalPlayers: totalPlayers
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="text-blue-100">Ready to play some cricket?</p>
        </div>

        {/* Main Menu Cards */}
        <div className="p-4 -mt-2">
          <div className="grid grid-cols-1 gap-4 mb-6">

            {/* Profile Card */}
            <Link href="/profile" className="block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100">Profile</h3>
                    <p className="text-slate-400 text-sm">View/Edit Personal Details</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Create Match Card */}
            <Link href="/create-match" className="block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-green-500 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100">Create Match</h3>
                    <p className="text-slate-400 text-sm">Practice, Friendly, Tournament, or Private Match</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Ongoing Matches Card */}
            {/*<Link href="/ongoing-matches" className="block">*/}
            {/*  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-orange-500 transition-all">*/}
            {/*    <div className="flex items-center space-x-4">*/}
            {/*      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">*/}
            {/*        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />*/}
            {/*        </svg>*/}
            {/*      </div>*/}
            {/*      <div className="flex-1">*/}
            {/*        <h3 className="text-lg font-semibold text-slate-100">*/}
            {/*          Ongoing Matches*/}
            {/*          {stats.activeMatches > 0 && (*/}
            {/*            <span className="ml-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">*/}
            {/*              {stats.activeMatches}*/}
            {/*            </span>*/}
            {/*          )}*/}
            {/*        </h3>*/}
            {/*        <p className="text-slate-400 text-sm">Continue or View Matches in Progress</p>*/}
            {/*      </div>*/}
            {/*      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />*/}
            {/*      </svg>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</Link>*/}

            {/* Past Matches Card */}
            {/*<Link href="/past-matches" className="block">*/}
            {/*  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-purple-500 transition-all">*/}
            {/*    <div className="flex items-center space-x-4">*/}
            {/*      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">*/}
            {/*        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />*/}
            {/*        </svg>*/}
            {/*      </div>*/}
            {/*      <div className="flex-1">*/}
            {/*        <h3 className="text-lg font-semibold text-slate-100">Past Matches</h3>*/}
            {/*        <p className="text-slate-400 text-sm">Access History, Scorecards, and Player Stats</p>*/}
            {/*      </div>*/}
            {/*      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />*/}
            {/*      </svg>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</Link>*/}

            {/* My Cricket Card */}
            {/*<Link href="/my-cricket" className="block">*/}
            {/*  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-yellow-500 transition-all">*/}
            {/*    <div className="flex items-center space-x-4">*/}
            {/*      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center">*/}
            {/*        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />*/}
            {/*        </svg>*/}
            {/*      </div>*/}
            {/*      <div className="flex-1">*/}
            {/*        <h3 className="text-lg font-semibold text-slate-100">My Cricket</h3>*/}
            {/*        <p className="text-slate-400 text-sm">Personal Match Record, Batting & Bowling Stats</p>*/}
            {/*      </div>*/}
            {/*      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">*/}
            {/*        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />*/}
            {/*      </svg>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</Link>*/}
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalMatches}</div>
                <div className="text-slate-400 text-sm">Total Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.totalTeams}</div>
                <div className="text-slate-400 text-sm">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.totalPlayers}</div>
                <div className="text-slate-400 text-sm">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.activeMatches}</div>
                <div className="text-slate-400 text-sm">Live Matches</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
