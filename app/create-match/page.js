"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";

export default function CreateMatchPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchType, setMatchType] = useState(null);

  // Match Configuration State
  const [matchData, setMatchData] = useState({
    matchType: "",
    gameType: "T20",
    customOvers: 20,
    team1: "",
    team2: "",
    pitchType: "",
    location: "",
    powerplayOvers: 6,
    totalOvers: 20,
    venue: "",
    date: "",
    time: "",
    tournament: ""
  });

  useEffect(() => {
    fetchTeams();
    fetchTournaments();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  };
  const fetchTournaments= async () => {
    try {
      const response = await fetch("/api/tournaments");
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const matchTypes = [
    {
      id: "practice",
      name: "Practice Match",
      description: "Casual practice session with flexible rules",
      icon: "🏏",
      color: "bg-blue-600"
    },
    {
      id: "friendly",
      name: "Friendly Match",
      description: "Friendly game between teams",
      icon: "🤝",
      color: "bg-green-600"
    },
    {
      id: "tournament",
      name: "Tournament Match",
      description: "Official tournament fixture",
      icon: "🏆",
      color: "bg-yellow-600"
    },
    {
      id: "private",
      name: "Private Match",
      description: "Private match with custom settings",
      icon: "🔒",
      color: "bg-purple-600"
    }
  ];

  const gameTypes = [
    { id: "T10", name: "T10", overs: 10, powerplay: 2 },
    { id: "T20", name: "T20", overs: 20, powerplay: 6 },
    { id: "ODI", name: "ODI", overs: 50, powerplay: 10 },
    { id: "Test", name: "Test Match", overs: 0, powerplay: 0 },
    { id: "Custom", name: "Custom Overs", overs: 0, powerplay: 0 }
  ];

  const pitchTypes = [
    { id: "turf", name: "Turf", description: "Natural grass pitch" },
    { id: "mat", name: "Mat", description: "Artificial mat pitch" },
    { id: "cement", name: "Cement", description: "Concrete pitch" },
    { id: "astroturf", name: "Astro Turf", description: "Synthetic grass" }
  ];

  const handleMatchTypeSelect = (type) => {
    setMatchData({ ...matchData, matchType: type });
    setStep(2);
    setMatchType(type);
  };

  const handleGameTypeSelect = (gameType) => {
    const selectedGame = gameTypes.find(g => g.id === gameType);
    setMatchData({
      ...matchData,
      gameType: gameType,
      totalOvers: selectedGame.overs,
      powerplayOvers: selectedGame.powerplay,
      customOvers: selectedGame.overs
    });
  };

  const handleCreateMatch = async () => {
    setLoading(true);
    try {
      const matchPayload = {
        matchNumber: `${matchData.matchType} Match`,
        status: "upcoming",
        teams: {
          teamA: matchData.team1,
          teamB: matchData.team2,
        },
        venue: {
          name: matchData.venue,
          city: matchData.location,
        },
        scheduledDate: new Date(`${matchData.date}T${matchData.time}`),
        matchType: matchData.gameType,
        notes: `${matchData.matchType} match at ${matchData.venue}, ${matchData.location}`,
      };

      // Add tournament only if matchType is "tournament"
      if (matchData.matchType === "tournament") {
        const selectedTournament = tournaments.find(
          (g) => g.id === matchData.tournament
        );
        matchPayload.tournament = {
          _id: matchData.tournament || null,
          name: selectedTournament ? selectedTournament.name : null,
        };
      }

      const response = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchPayload),
      });

      if (response.ok) {
        const newMatch = await response.json();
        router.push(`/matches`);
      } else {
        const errorData = await response.json();
        console.error("Error creating match:", errorData);
        alert(errorData.error || "Error creating match");
      }
    } catch (error) {
      console.error("Error creating match:", error);
      alert("Error creating match. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="mb-4 flex items-center text-green-100 hover:text-white"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold mb-2">Create New Match</h1>
          <p className="text-green-100">
            {step === 1 ? "Select match type" : step === 2 ? "Configure match settings" : "Review and create"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="p-4">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? "bg-green-600 text-white" : "bg-slate-700 text-slate-400"
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-1 mx-2 ${
                    step > stepNum ? "bg-green-600" : "bg-slate-700"
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Match Type Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Select Match Type</h2>
              <div className="grid grid-cols-1 gap-4">
                {matchTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleMatchTypeSelect(type.id)}
                    className={`${type.color} hover:opacity-90 text-white rounded-xl p-6 text-left transition-all active:scale-95`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{type.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{type.name}</h3>
                        <p className="text-sm opacity-90">{type.description}</p>
                      </div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Match Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Match Configuration</h2>

              {/* Game Type */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Game Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {gameTypes.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameTypeSelect(game.id)}
                      className={`p-4 rounded-lg border transition-all ${
                        matchData.gameType === game.id
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="font-medium">{game.name}</div>
                      {game.overs > 0 && (
                        <div className="text-sm opacity-80">{game.overs} overs</div>
                      )}
                    </button>
                  ))}
                </div>

                {matchData.gameType === "Custom" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Custom Overs
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={matchData.customOvers}
                      onChange={(e) => setMatchData({
                        ...matchData,
                        customOvers: parseInt(e.target.value) || 0,
                        totalOvers: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                      placeholder="Enter number of overs"
                    />
                  </div>
                )}
              </div>

              {/* Teams Selection */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Select Teams</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Team 1</label>
                    <select
                      value={matchData.team1}
                      onChange={(e) => setMatchData({ ...matchData, team1: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                    >
                      <option value="">Select Team 1</option>
                      {teams.map((team) => (
                        <option key={team._id} value={team._id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Team 2</label>
                    <select
                      value={matchData.team2}
                      onChange={(e) => setMatchData({ ...matchData, team2: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                    >
                      <option value="">Select Team 2</option>
                      {teams.filter(team => team._id !== matchData.team1).map((team) => (
                        <option key={team._id} value={team._id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pitch Type */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Pitch Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {pitchTypes.map((pitch) => (
                    <button
                      key={pitch.id}
                      onClick={() => setMatchData({ ...matchData, pitchType: pitch.id })}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        matchData.pitchType === pitch.id
                          ? "border-green-500 bg-green-600 text-white"
                          : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="font-medium">{pitch.name}</div>
                      <div className="text-sm opacity-80">{pitch.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Match Details */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Match Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Venue Name</label>
                    <input
                      type="text"
                      value={matchData.venue}
                      onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                      placeholder="Enter venue name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Location</label>
                    <input
                      type="text"
                      value={matchData.location}
                      onChange={(e) => setMatchData({ ...matchData, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                      placeholder="City, State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Date</label>
                      <input
                        type="date"
                        value={matchData.date}
                        onChange={(e) => setMatchData({ ...matchData, date: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">Time</label>
                      <input
                        type="time"
                        value={matchData.time}
                        onChange={(e) => setMatchData({ ...matchData, time: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Details */}
              {matchType == 'tournament' && <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Tournament Details</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">tournament</label>
                  <select
                    value={matchData?.tournament}
                    onChange={(e) => setMatchData({...matchData, tournament: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                  >
                    <option value="">Select Tournament</option>
                    {tournaments?.map((item) => (
                      <option key={item._id} value={item._id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              }
              {/* Powerplay Settings */}
              {matchData.gameType !== "Test" && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Powerplay Settings</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Powerplay Overs ({matchData.powerplayOvers})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={Math.min(matchData.totalOvers, 15)}
                      value={matchData.powerplayOvers}
                      onChange={(e) => setMatchData({ ...matchData, powerplayOvers: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>0</span>
                      <span>{Math.min(matchData.totalOvers, 15)}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(3)}
                disabled={!matchData.team1 || !matchData.team2 || !matchData.venue}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Review Match Details
              </button>
            </div>
          )}

          {/* Step 3: Review and Create */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">Review Match Details</h2>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Match Type:</span>
                    <span className="text-slate-100 capitalize">{matchData.matchType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Game Format:</span>
                    <span className="text-slate-100">{matchData.gameType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overs:</span>
                    <span className="text-slate-100">{matchData.totalOvers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Teams:</span>
                    <span className="text-slate-100">
                      {teams.find(t => t._id === matchData.team1)?.name} vs {teams.find(t => t._id === matchData.team2)?.name}
                    </span>
                  </div>
                  {matchType === 'tournament' && <div className="flex justify-between">
                    <span className="text-slate-400">Tournament:</span>
                    <span className="text-slate-100">
                      {tournaments.find(t => t._id === matchData.tournament)?.name}
                    </span>
                  </div>}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Venue:</span>
                    <span className="text-slate-100">{matchData.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-100">{matchData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="text-slate-100">{matchData.date} at {matchData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pitch Type:</span>
                    <span className="text-slate-100 capitalize">{matchData.pitchType}</span>
                  </div>
                  {matchData.gameType !== "Test" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Powerplay:</span>
                      <span className="text-slate-100">{matchData.powerplayOvers} overs</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleCreateMatch}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {loading ? "Creating..." : "Create Match"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
