"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import MobileLayout from "@/components/MobileLayout";
import { Shuffle } from "lucide-react";

export default function ScorePage() {
  const params = useParams();
  const matchId = params.matchId;

  // Match state
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentInnings, setCurrentInnings] = useState({});

  // Team players state
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [battingTeamPlayers, setBattingTeamPlayers] = useState([]);
  const [bowlingTeamPlayers, setBowlingTeamPlayers] = useState([]);

  // Scoring state
  const [showWicketPanel, setShowWicketPanel] = useState(false);
  const [showExtrasPanel, setShowExtrasPanel] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(false);
  const [ballHistory, setBallHistory] = useState([]);

  // Current match state
  const [currentBowler, setCurrentBowler] = useState({ name: '', _id: '' });
  const [striker, setStriker] = useState({ name: '', _id: '' });
  const [nonStriker, setNonStriker] = useState({ name: '', _id: '' });
  const [currentOver, setCurrentOver] = useState(1);
  const [currentBall, setCurrentBall] = useState(0);
  const [battingTeam, setBattingTeam] = useState({ name: '', _id: '' });
  const [bowlingTeam, setBowlingTeam] = useState({ name: '', _id: '' });

  useEffect(() => {
    if (matchId) {
      fetchMatch();
      fetchBallHistory()
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}`);
      const data = await response.json();
      setMatch(data);
      // Fetch team players if match has team IDs
      if (Object.keys(data.teams).length > 0) {
        await fetchTeamPlayers(data.teams);
      }

    } catch (error) {
      console.error("Error fetching match:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPlayers = async (teams) => {
    try {
      // Fetch both teams' players in parallel
      const [team1Response, team2Response] = await Promise.all([
        fetch(`/api/teams/${teams.teamA}`),
        fetch(`/api/teams/${teams.teamB}`)
      ]);

      const team1Data = await team1Response.json();
      const team2Data = await team2Response.json();

      setBattingTeam({ name: team1Data.name, _id: team1Data._id });
      setBowlingTeam({ name: team2Data.name, _id: team2Data._id });

      setTeam1Players(team1Data.players || []);
      setTeam2Players(team2Data.players || []);

      // Set initial batting and bowling teams (team1 bats first by default)
      setBattingTeamPlayers(team1Data.players || []);
      setBowlingTeamPlayers(team2Data.players || []);

    } catch (error) {
      console.error("Error fetching team players:", error);
    }
  };

  const switchTeams = () => {

    // Switch batting and bowling teams (for innings change)
    setBattingTeamPlayers(bowlingTeamPlayers);
    setBowlingTeamPlayers(battingTeamPlayers);
    setBattingTeam(bowlingTeam);
    setBowlingTeam(battingTeam);

    // Reset current players
    setStriker({ name: '', _id: '' });
    setNonStriker({ name: '', _id: '' });
    setCurrentBowler({ name: '', _id: '' });
    setBallHistory([]);
  };

  const fetchBallHistory = async () => {
    const response = await fetch(`/api/matches/${matchId}/ball`);
    const data = await response.json();
        updateCurrentInnings(data);
  }

  const updateCurrentInnings = async (data, updatedStriker = null, updatedNonStriker) => {
    console.log("current innings data", data?.ball);
    setCurrentInnings(data?.ball);
    setCurrentOver(data?.ball?.over || 1);
    setBallHistory(data?.ball?.bowling?.currentOverStats?.balls);
    setCurrentBall(data?.ball?.bowling?.currentOverStats?.balls?.length || 0);
    
    // If ball data exists and has team IDs, fetch and set the teams
    if (data?.ball?.battingTeam && data?.ball?.bowlingTeam) {
      try {
        // Fetch both teams' data in parallel
        const [battingTeamResponse, bowlingTeamResponse] = await Promise.all([
          fetch(`/api/teams/${data.ball.battingTeam}`),
          fetch(`/api/teams/${data.ball.bowlingTeam}`)
        ]);

        const battingTeamData = await battingTeamResponse.json();
        const bowlingTeamData = await bowlingTeamResponse.json();

        // Set the teams
        setBattingTeam({ name: battingTeamData.name, _id: battingTeamData._id });
        setBowlingTeam({ name: bowlingTeamData.name, _id: bowlingTeamData._id });

        // Set the team players
        setBattingTeamPlayers(battingTeamData.players || []);
        setBowlingTeamPlayers(bowlingTeamData.players || []);

        // Also update the main team players state
        if (battingTeamData._id === match?.teams?.teamA) {
          setTeam1Players(battingTeamData.players || []);
          setTeam2Players(bowlingTeamData.players || []);
        } else {
          setTeam1Players(bowlingTeamData.players || []);
          setTeam2Players(battingTeamData.players || []);
        }
      } catch (error) {
        console.error("Error fetching team data on refresh:", error);
      }
    }
    
    const strikerData = {
      name: data?.ball?.batting[0]?.player,
      _id: data?.ball?.batting[0]?._id
    }
    const nonStrikerData = {
      name: data?.ball?.batting[1]?.player,
      _id: data?.ball?.batting[1]?._id
    }
    const bowlerData = {
      name: data?.ball?.bowling?.bowler,
      _id: data?.ball?.bowling?._id
    }
    setStriker(updatedStriker ? updatedStriker : strikerData)
    setNonStriker(updatedNonStriker ? updatedNonStriker : nonStrikerData)
    setCurrentBowler(bowlerData)
  }

  const recordBall = async (ballData) => {
    try {

      let ballNumber = currentInnings?.ballNumber || 0;
      let latestCurrentBall = currentBall
      let updatedStriker = striker;
      let updatedNonStriker = nonStriker;
      let over = 1

      if (ballData.isValidBall) {

        if (currentBall >=6 && ballNumber % 6 === 0) {
          return setShowPlayerPanel(true);
        }

          ballNumber++
          latestCurrentBall ++
        if (ballData.runs % 2 === 1 && latestCurrentBall <= 6) {
          const temp = updatedStriker;
          updatedStriker = updatedNonStriker;
          updatedNonStriker = temp;
        }

      }

      if(ballNumber > 6 )
        over = Math.floor(ballNumber / 6)+1

      const response = await fetch(`/api/matches/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ballData,
          match_id: matchId,
          innings_id: 1,
          over: over,
          ballNumber,
          striker: striker.name,
          nonStriker: nonStriker.name,
          bowler: currentBowler.name,
          battingTeam: battingTeam._id,
          bowlingTeam: bowlingTeam._id,
        }),
      });

      if (response.ok) {
        const updatedInnings = await response.json();
        if(ballData?.wicket?.isWicket){
          updatedStriker= {name: '', _id: ''}
        }

        updateCurrentInnings(updatedInnings, updatedStriker, updatedNonStriker);
      }
    } catch (error) {
      console.error("Error recording ball:", error);
    }
  };

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


  const undoLastBall = async () => {
    try {
      console.log(currentInnings);
      const response = await fetch(`/api/matches/${matchId}/undo`, {
        method: "POST",
        body: JSON.stringify({
          _id: currentInnings._id
        })
      });

      if (response) {
        await fetchMatch();
        await fetchBallHistory();
      }
    } catch (error) {
      console.error("Error undoing ball:", error);
    }
  };

  const handleRunsScored = (runs) => {

    const strikerStats = currentInnings?.batting?.find(b => b.player === striker.name) || { runs: 0, balls: 0 };
    const nonStrikerStats = currentInnings?.batting?.find(b => b.player === nonStriker.name) || { runs: 0, balls: 0 };
    const strikerUpdate = {
      player: striker.name,
      runs: strikerStats.runs + runs,
      balls: strikerStats.balls + 1,
    };

    const nonStrikerUpdate = {
      player: nonStriker.name,
      runs: nonStrikerStats.runs,
      balls: nonStrikerStats.balls,
    };

    let prevBowling = currentInnings?.bowling || {}; // fallback if undefined
    let prevOverStats = prevBowling.currentOverStats || { balls: [] };

    if(currentBall == 0){
      prevBowling = {}
      prevOverStats = { balls: [] };
    }

    // Add new ball to over
    const newBall = {
      ballNumber: (currentBall + 1),
      runs,
      isWicket: false,
      extras: {},
    };
    const updatedBalls = [...prevOverStats.balls, newBall];
    const bowlingStats = {
      bowler: currentBowler.name,
      _id:currentBowler._id,
      totalRuns: runs + (prevBowling.totalRuns || 0),
      totalBallBowled: (prevBowling.totalBallBowled || 0) + 1,
      currentOverStats: {
        over: currentOver || 1,
        balls: updatedBalls, // store all balls of current over
        runs: (prevOverStats.runs || 0) + runs,
        wickets: prevOverStats.wickets || 0,
        maidens: prevOverStats.maidens || 0,
        wides: prevOverStats.wides || 0,
        noBalls: prevOverStats.noBalls || 0,
        economy: ((runs + (prevBowling.totalRuns || 0)) / (((prevBowling.totalBallBowled || 0) + 1) / 6)).toFixed(2),
      },
    };


    recordBall({
      runs,
      totalRuns: runs + (currentInnings?.totalRuns || 0),
      isValidBall: true,
      extras: {}, // no extras
      batting: [strikerUpdate, nonStrikerUpdate],
      bowling: bowlingStats
    });
  };

  const handleWicket = (wicketData) => {
    console.log(wicketData,"wicketData");
    const strikerStats =
      currentInnings?.batting?.find(b => b.player === striker.name) || { runs: 0, balls: 0 };

    const strikerUpdate = {
      player: striker.name,
      runs: strikerStats.runs,
      balls: strikerStats.balls + 1, // faced the ball
      isOut: true,
      dismissalType: wicketData.dismissalType,
    };

    const nonStrikerStats =
      currentInnings?.batting?.find(b => b.player === nonStriker.name) || { runs: 0, balls: 0 };

    const nonStrikerUpdate = {
      player: nonStriker.name,
      runs: nonStrikerStats.runs,
      balls: nonStrikerStats.balls,
    };

    const prevBowling = currentInnings.bowling || {};
    const prevOverStats = prevBowling.currentOverStats || { balls: [] };

    // Record new ball in this over
    const newBall = {
      ballNumber: (currentBall + 1),
      runs: 0,
      isWicket: true,
      wicket: wicketData,
      extras: {},
    };

    const updatedBalls = [...prevOverStats.balls, newBall];

    const bowlingStats = {
      bowler: currentBowler.name,
      totalRuns: prevBowling.totalRuns || 0,
      totalBallBowled: (prevBowling.totalBallBowled || 0) + 1,
      currentOverStats: {
        over: currentOver || 1,
        balls: updatedBalls,
        runs: prevOverStats.runs || 0,
        wickets: (prevOverStats.wickets || 0) + 1,
        maidens: prevOverStats.maidens || 0,
        wides: prevOverStats.wides || 0,
        noBalls: prevOverStats.noBalls || 0,
        economy: (
          (prevBowling.totalRuns || 0) /
          (((prevBowling.totalBallBowled || 0) + 1) / 6)
        ).toFixed(2),
      },
    };

    recordBall({
      runs: 0,
      totalRuns: currentInnings.totalRuns || 0, // no runs added
      isValidBall: true,
      wicket: {
        isWicket: true,
        ...wicketData,
      },
      batting: [strikerUpdate, nonStrikerUpdate],
      bowling: bowlingStats,
    });

    setShowWicketPanel(false);
  };


  const handleExtras = (extraData) => {
    const prevBowling = currentInnings.bowling || {};
    const prevOverStats = prevBowling.currentOverStats || { balls: [] };

    const isValidBall = extraData.type === "bye" || extraData.type === "legbye";
    const runs = extraData.runs || 1;

    // --- Batting Updates (bye/legbye count as balls faced) ---
    const strikerStats = currentInnings?.batting?.find(b => b.player === striker.name) || { runs: 0, balls: 0 };
    const nonStrikerStats = currentInnings?.batting?.find(b => b.player === nonStriker.name) || { runs: 0, balls: 0 };

    const strikerUpdate = {
      player: striker.name,
      runs: strikerStats.runs + (extraData.type === "bye" || extraData.type === "legbye" ? 0 : runs),
      balls: strikerStats.balls + (isValidBall ? 1 : 0),
    };

    const nonStrikerUpdate = {
      player: nonStriker.name,
      runs: nonStrikerStats.runs,
      balls: nonStrikerStats.balls,
    };

    // --- Ball Object ---
    const newBall = {
      ballNumber: (currentBall + 1),
      runs,
      isWicket: false,
      extras: {
        type: extraData.type,
        runs,
      },
    };

    const updatedBalls = [...prevOverStats.balls, newBall];

    // --- Bowling Stats ---
    const bowlingStats = {
      bowler: currentBowler.name,
      totalRuns: runs + (prevBowling.totalRuns || 0),
      totalBallBowled: (prevBowling.totalBallBowled || 0) + (isValidBall ? 1 : 0),
      currentOverStats: {
        over: currentOver || 1,
        balls: updatedBalls,
        runs: (prevOverStats.runs || 0) + runs,
        wickets: prevOverStats.wickets || 0,
        maidens: prevOverStats.maidens || 0,
        wides: prevOverStats.wides + (extraData.type === "wide" ? 1 : 0) || 0,
        noBalls: prevOverStats.noBalls + (extraData.type === "noball" ? 1 : 0) || 0,
        economy: (
          (runs + (prevBowling.totalRuns || 0)) /
          (((prevBowling.totalBallBowled || 0) + (isValidBall ? 1 : 0)) / 6 || 1)
        ).toFixed(2),
      },
    };

    // --- Send Ball Record ---
    recordBall({
      runs,
      totalRuns: (currentInnings.totalRuns || 0) + runs,
      isValidBall,
      extras: {
        isExtra: true,
        type: extraData.type,
        runs,
      },
      batting: [strikerUpdate, nonStrikerUpdate],
      bowling: bowlingStats,
    });

    setShowExtrasPanel(false);
  };


  if (loading) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-slate-300 mt-4">Loading match...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!match) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-300">Match not found</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Live Score Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="text-center">
            <h1 className="text-slate-100 font-bold text-lg">{match.matchNumber || "Live Match"}</h1>
            <div className="text-2xl font-bold text-blue-400 mt-2">
              {currentInnings?.totalRuns || 0}/{currentInnings?.totalWickets || 0}
            </div>
            <div className="text-slate-300 text-sm">
              ({Math.floor(currentInnings?.ballNumber / 6) || 0}.{(currentInnings?.ballNumber % 6) || 0}/{match.matchType === "T20" ? "20" : "50"} Overs)
            </div>
            <div className="text-slate-400 text-xs mt-1">
              CRR: {calculateCRR()}
              {/*{currentInnings?.totalOvers > 0 && " • RRR: " + ((currentInnings.target - currentInnings.totalRuns) / ((match.matchType === "T20" ? 20 : 50) - currentInnings.totalOvers)).toFixed(2)}*/}
            </div>
          </div>

          {/* Current Players */}
          <div className="flex justify-between mt-4 text-sm">
            <div className="text-slate-300">
              <div className="font-medium">{striker?.name || "Select Striker"} *</div>
              <div className="text-xs text-slate-400">
                {currentInnings?.batting?.find(b => b.player === striker?.name)?.runs || 0}
                ({currentInnings?.batting?.find(b => b.player === striker?.name)?.balls || 0})
              </div>
            </div>
            {/* Swap Icon in Center */}
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const temp = striker;
                  setStriker(nonStriker);
                  setNonStriker(temp);
                }}
                className="p-2 rounded-full hover:bg-gray-200 transition"
              >
                <Shuffle className="w-6 h-6 text-indigo-600" />
              </button>
            </div>
            <div className="text-slate-300 text-right">
              <div className="font-medium">{nonStriker?.name || "Select Non-Striker"}</div>
              <div className="text-xs text-slate-400">
                {currentInnings?.batting?.find(b => b.player === nonStriker?.name)?.runs || 0}
                ({currentInnings?.batting?.find(b => b.player === nonStriker?.name)?.balls || 0})
              </div>
            </div>
          </div>

          <div className="text-center mt-2 text-sm text-slate-300">
            <span className="font-medium">{currentBowler?.name || "Select Bowler"}</span>
            <span className="text-slate-400 text-xs ml-2">
              {/*{currentInnings?.bowling?.(b => b.player === currentBowler?._id)?.overs || 0}-*/}
              {/*{currentInnings?.bowling?.find(b => b.player === currentBowler?._id)?.runs || 0}-*/}
              {/*{currentInnings?.bowling?.find(b => b.player === currentBowler?._id)?.wickets || 0}*/}
            </span>
          </div>
        </div>

        {/* Current Over Display */}
        <div className="bg-slate-700 p-3 border-b border-slate-600">
          <div className="text-center">
            <div className="text-slate-200 text-sm font-medium mb-2">This Over</div>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: ballHistory?.length || 6 }, (_, i) => {
                const ball = ballHistory?.[i];
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${ball
                      ? ball.wicket?.isWicket
                        ? "bg-red-600 text-white"
                        : ball.runs === 4
                          ? "bg-green-600 text-white"
                          : ball.runs === 6
                            ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
                      : "bg-slate-600 text-slate-400"
                      }`}
                  >
                    {ball ? (ball.isWicket ? "W" : ball.runs) : "•"}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scoring Buttons */}
        <div className="p-4">
          {/* Run Scoring Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
              <button
                key={runs}
                onClick={() => handleRunsScored(runs)}
                className={`h-16 rounded-lg font-bold text-lg transition-all ${runs === 0
                  ? "bg-slate-600 hover:bg-slate-500 text-white"
                  : runs === 4
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : runs === 6
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                {runs}
              </button>
            ))}

            {/* Wicket Button */}
            <button
              onClick={() => setShowWicketPanel(true)}
              className="h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all"
            >
              OUT
            </button>
          </div>

          {/* Extras and Actions */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              // onClick={() => setShowExtrasPanel(true)}
              onClick={() => setShowPlayerPanel(true)}
              className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all"
            >
              Update Players
            </button>
            <button
              onClick={undoLastBall}
              className="h-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-all"
            >
              UNDO
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              disabled={true}
              onClick={() => setShowExtrasPanel(true)}
              className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all"
            >
              Extras (coming soon)
            </button>
            {/*<button className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all">*/}
            {/*  5/7/P*/}
            {/*</button>*/}
            {/*<button className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all">*/}
            {/*  Options*/}
            {/*</button>*/}
          </div>
        </div>

        {/* Wicket Panel */}
        {showWicketPanel && (
          <WicketPanel
            onClose={() => setShowWicketPanel(false)}
            onWicket={handleWicket}
            currentBowler={currentBowler}
            striker={striker}
          />
        )}

        {/* Extras Panel */}
        {showExtrasPanel && (
          <ExtrasPanel
            onClose={() => setShowExtrasPanel(false)}
            onExtra={handleExtras}
          />
        )}

        {/* Player Management Panel */}
        {showPlayerPanel && (
          <PlayerPanel
            onClose={() => setShowPlayerPanel(false)}
            match={match}
            currentInnings={currentInnings}
            onPlayersUpdate={fetchMatch}
            striker={striker}
            nonStriker={nonStriker}
            bowler={currentBowler}
            setStriker={setStriker}
            setNonStriker={setNonStriker}
            setBowler={setCurrentBowler}
            setBallHistory={setBallHistory}
            battingTeamPlayers={battingTeamPlayers}
            bowlingTeamPlayers={bowlingTeamPlayers}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            switchTeams={switchTeams}
            setCurrentBall={setCurrentBall}
          />
        )}
      </div>
    </MobileLayout>
  );
}

// Wicket Panel Component
function WicketPanel({ onClose, onWicket, currentBowler, striker }) {
  const [dismissalType, setDismissalType] = useState("");
  const [fielder, setFielder] = useState("");

  const dismissalTypes = [
    "Bowled", "Caught", "LBW", "Stumped", "Run Out", "Hit Wicket", "Obstructing"
  ];

  const handleSubmit = () => {
    if (dismissalType) {
      onWicket({
        dismissalType,
        bowler: ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"].includes(dismissalType) ? currentBowler?._id : null,
        fielder: fielder || null,
        batsmanOut: striker?._id
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-100">Wicket Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Dismissal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {dismissalTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setDismissalType(type)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${dismissalType === type
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {["Caught", "Run Out", "Stumped"].includes(dismissalType) && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Fielder</label>
              <input
                type="text"
                value={fielder}
                onChange={(e) => setFielder(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100"
                placeholder="Enter fielder name"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!dismissalType}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Record Wicket
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extras Panel Component
function ExtrasPanel({ onClose, onExtra }) {
  const [extraType, setExtraType] = useState("");
  const [runs, setRuns] = useState(1);

  const extraTypes = [
    { type: "wide", label: "Wide", color: "bg-orange-600" },
    { type: "noball", label: "No Ball", color: "bg-orange-600" },
    { type: "bye", label: "Bye", color: "bg-yellow-600" },
    { type: "legbye", label: "Leg Bye", color: "bg-yellow-600" }
  ];

  const handleSubmit = () => {
    if (extraType) {
      onExtra({
        type: extraType,
        runs: runs
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-100">Extras</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Extra Type</label>
            <div className="grid grid-cols-2 gap-2">
              {extraTypes.map((extra) => (
                <button
                  key={extra.type}
                  onClick={() => setExtraType(extra.type)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${extraType === extra.type
                    ? extra.color + " text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                >
                  {extra.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Runs</label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((runValue) => (
                <button
                  key={runValue}
                  onClick={() => setRuns(runValue)}
                  className={`w-12 h-12 rounded-lg font-bold transition-all ${runs === runValue
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                >
                  {runValue}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!extraType}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Record Extra
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Panel Component (Updated with Real Team Players)
function PlayerPanel({ onClose, striker, nonStriker, bowler, setStriker, setNonStriker, setBowler, setBallHistory, battingTeamPlayers, bowlingTeamPlayers, battingTeam, bowlingTeam, switchTeams, setCurrentBall }) {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg border border-slate-700 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-100">Player Management</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Team Information */}
        <div className="mb-6 p-3 bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-300 mb-2">
            <span className="font-medium text-green-400">Batting Team:</span>{battingTeam.name} ({battingTeamPlayers.length} players)
          </div>
          <div className="text-sm text-slate-300 mb-3">
            <span className="font-medium text-blue-400">Bowling Team:</span>{bowlingTeam.name} ({bowlingTeamPlayers.length} players)
          </div>
          <button
            onClick={() => {
              switchTeams()
            }}
          
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Switch Teams (Innings Change) 
          </button>
        </div>

        {/* Player Dropdowns */}
        <div className="space-y-4">
          {/* Batting Team Players */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-medium text-sm border-b border-slate-600 pb-2">Batting Team Players</h4>

            <div className="flex flex-col text-left">
              <label className="text-slate-300 mb-1">Striker *</label>
              <select
                onChange={(e) => {
                  const selectedPlayer = battingTeamPlayers.find(p => p.player._id === e.target.value);
                  setStriker({name: selectedPlayer?.player?.name || e.target.value, _id: selectedPlayer?.player?._id});
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={striker?._id || ""}
              >
                <option value="">Select Striker</option>
                {battingTeamPlayers
                  .filter(teamPlayer => teamPlayer.player._id !== nonStriker._id)
                  .map((teamPlayer) => (
                    <option key={teamPlayer.player._id} value={teamPlayer.player._id}>
                      {teamPlayer.player.name} - {teamPlayer.role}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col text-left">
              <label className="text-slate-300 mb-1">Non-Striker</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={nonStriker?._id || ""}
                onChange={(e) => {
                  const selectedPlayer = battingTeamPlayers.find(p => p.player._id === e.target.value);
                  setNonStriker({name: selectedPlayer?.player?.name || e.target.value, _id: selectedPlayer?.player?._id});
                }}
              >
                <option value="">Select Non-Striker</option>
                {battingTeamPlayers
                  .filter(teamPlayer => teamPlayer.player._id !== striker._id)
                  .map((teamPlayer) => (
                    <option key={teamPlayer.player._id} value={teamPlayer.player._id}>
                      {teamPlayer.player.name} - {teamPlayer.role}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Bowling Team Players */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-medium text-sm border-b border-slate-600 pb-2">Bowling Team Players</h4>

            <div className="flex flex-col text-left">
              <label className="text-slate-300 mb-1">Bowler</label>
              <select
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={bowler._id || ""}
                onChange={(e) => {
                  const selectedPlayer = bowlingTeamPlayers.find(p => p.player._id === e.target.value);
                  setBowler({name: selectedPlayer?.player?.name || e.target.value, _id: selectedPlayer?.player?._id});
                  setBallHistory([]);
                  setCurrentBall(0);
                }}
              >
                <option value="">Select Bowler</option>
                {bowlingTeamPlayers.map((teamPlayer) => (
                  <option key={teamPlayer.player._id} value={teamPlayer.player._id}>
                    {teamPlayer.player.name} - {teamPlayer.role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Player Stats Display */}
        {(striker.name || nonStriker.name || bowler.name) && (
          <div className="mt-6 p-3 bg-slate-700 rounded-lg">
            <h4 className="text-slate-200 font-medium text-sm mb-3">Current Players</h4>
            <div className="space-y-2 text-sm">
              {striker.name && (
                <div className="flex justify-between">
                  <span className="text-slate-300">Striker:</span>
                  <span className="text-green-400 font-medium">{striker.name}</span>
                </div>
              )}
              {nonStriker.name && (
                <div className="flex justify-between">
                  <span className="text-slate-300">Non-Striker:</span>
                  <span className="text-green-400 font-medium">{nonStriker.name}</span>
                </div>
              )}
              {bowler.name && (
                <div className="flex justify-between">
                  <span className="text-slate-300">Bowler:</span>
                  <span className="text-blue-400 font-medium">{bowler.name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-slate-600 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}



