"use client";
import React, {useState, useEffect} from "react";
import { PK, IN } from "country-flag-icons/react/3x2";
import {useParams} from "next/navigation"; // Pakistan & India

export default function Page() {
  const params = useParams();
  const matchId = params.matchId;
  const [batting, setBatting] = useState([]);
  const [bowling, setBowling] = useState([]);
  const [currentInnings, setCurrentInnings] = useState(null);
  const [match, setMatch] = useState(null);
  const [battingTeam, setBattingTeam] = useState(null);
  const [bowlingTeam, setBowlingTeam] = useState(null);

  useEffect(() => {
    if (!matchId) return;
  
    // initial fetch
    fetchMatch();
    fetchBallHistory();
  
    // set up interval
    const interval = setInterval(() => {
      fetchMatch();
      fetchBallHistory();
    }, 10000); // 10 sec = 10000 ms
  
    // cleanup interval on unmount or matchId change
    return () => clearInterval(interval);
  }, [matchId]);


  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      const data = await response.json();
      setMatch(data);

    } catch (error) {
      console.error("Error fetching match:", error);
    }
  };

  const fetchBallHistory = async () => {
    const response = await fetch(`/api/matches/${matchId}/ball`);
    const data = await response.json();
    if(data.success) {
      updateData(data.ball)
    }
  }

  const updateData = async(ball) => {
    const [battingTeamResponse, bowlingTeamResponse] = await Promise.all([
      fetch(`/api/teams/${ball.battingTeam}`),
      fetch(`/api/teams/${ball.bowlingTeam}`)
    ]);

    const battingTeamData = await battingTeamResponse.json();
    const bowlingTeamData = await bowlingTeamResponse.json();

    // Set the teams
    setBattingTeam(battingTeamData);
    setBowlingTeam(bowlingTeamData);

    setBatting(ball.batting);
    setBowling(ball.bowling);
    setCurrentInnings(ball);
  }

  const calculateCRR = () => {
    if (!currentInnings) return "0.00";

    const totalRuns = currentInnings?.totalRuns || 0;
    const totalBalls = currentInnings?.ballNumber || 0;

    // If less than one over bowled, return 0
    if (totalBalls === 0) return "0.00";

    // Overs faced in cricket = completed overs + remaining balls/6
    const oversFaced = Math.floor(totalBalls / 6) + (totalBalls % 6) / 6;

    console.log("CRR", { totalRuns, totalBalls, oversFaced });

    return oversFaced > 0 ? (totalRuns / oversFaced).toFixed(2) : "0.00";
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-100">
      {/* Page Content */}
      <main className="flex-grow flex items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-800">Cricket Match Live</h1>
      </main>

      {/* Professional ICC Style Score Ribbon */}
      <footer className="bg-gray-900 text-white shadow-2xl mb-2 mx-2">
        <div className="flex items-center justify-between px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap overflow-x-auto no-scrollbar">

          {/* Left Section: Team + Score */}
          <div className="flex items-center gap-2 sm:gap-3 border-r border-gray-700 pr-4 sm:pr-6 flex-shrink-0">
            <PK title="Pakistan" className="w-6 h-4 sm:w-8 sm:h-6 rounded-sm shadow" />
            <span className="text-green-400 text-base sm:text-lg font-extrabold">{battingTeam?.slug}</span>
            <span className="text-yellow-400 text-lg sm:text-2xl font-black">{currentInnings?.totalRuns}-{currentInnings?.totalWickets}</span>
            <span className="text-gray-300 text-[10px] sm:text-xs">{Math.floor(currentInnings?.ballNumber / 6) || 0}.{(currentInnings?.ballNumber % 6) || 0} ov</span>
            <div className="ml-2 sm:ml-4 text-[10px] sm:text-xs text-gray-400">
              CRR: <span className="text-white font-bold">{calculateCRR()}</span>
            </div>
          </div>

          {/* Match Type Badge (T20) */}
          <div className="mx-2 sm:mx-4 bg-white text-black px-3 py-1 rounded-md text-[10px] sm:text-xs font-semibold shadow flex-shrink-0">
          {match?.matchType || "T20"}
          </div>

          {/* Middle Section: Batsmen (HIDE on small, SHOW from sm: up) */}
          <div className="hidden sm:flex flex-1 justify-center items-center border-r border-gray-700 px-4 sm:px-6 min-w-0 overflow-hidden">
            <div className="flex justify-between w-full max-w-md gap-6 sm:gap-12 truncate">
              {/* H Nawaz */}
              <div className="flex items-center gap-1 sm:gap-2 truncate">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400"
                >
                  <path d="M498.1 14.1c-18.8-18.8-49.2-18.8-67.9 0l-63 63-18.7-18.7-42.4 42.4 18.7 18.7L63 382.3l-42.4 42.4c-18.8 18.8-18.8 49.2 0 67.9s49.2 18.8 67.9 0l42.4-42.4L392.3 178l18.7 18.7 42.4-42.4-18.7-18.7 63-63c-18.9-18.8 18.9-49.2 0-67.9z" />
                </svg>
                <span className="text-gray-400 text-[11px] sm:text-sm truncate">{batting?.[0]?.player}*</span>
                <span className="text-white text-[11px] sm:text-sm font-semibold">{batting?.[0]?.runs} ({batting?.[0]?.balls})</span>
              </div>

              {/* Farhan */}
              <div className="flex items-center gap-1 sm:gap-2 truncate">
                <span className="text-gray-400 text-[11px] sm:text-sm truncate">{batting?.[1]?.player}</span>
                <span className="text-white text-[11px] sm:text-sm font-semibold">{batting?.[1]?.runs} ({batting?.[1]?.balls})</span>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 pl-4 sm:pl-6">
            {/* Bowler info (HIDE on mobile, SHOW from sm: up) */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2 min-w-0 overflow-hidden truncate">
              <span className="text-gray-400 text-[11px] sm:text-sm truncate">{bowling?.bowler}</span>
              {/* <span className="text-white text-[11px] sm:text-sm font-semibold">1-{bowling?.totalRuns} ({Math.floor(bowling?.totalBallBowled / 6)}.{(bowling?.totalBallBowled % 6)})</span> */}
              <span className="text-white text-[11px] sm:text-sm font-semibold">({(bowling?.totalBallBowled % 6)})</span>

            </div>
            {/* Flag (always visible) */}
            <div className=" flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <IN title="India" className="w-6 h-4 sm:w-8 sm:h-6 rounded-sm shadow" />
              <span className="text-green-400 text-base sm:text-lg font-extrabold">{bowlingTeam?.slug}</span>
            </div>
          </div>
        </div>
      </footer>












    </div>
  );
}
