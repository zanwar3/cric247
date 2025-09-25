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

  // Scoring state
  const [showWicketPanel, setShowWicketPanel] = useState(false);
  const [showExtrasPanel, setShowExtrasPanel] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(false);
  const [ballHistory, setBallHistory] = useState([]);

  // Current match state
  const [currentBowler, setCurrentBowler] = useState({ name: 'shaheen' });
  const [striker, setStriker] = useState({ name: 'Baber' });
  const [nonStriker, setNonStriker] = useState({ name: 'Rizwan' });
  const [currentOver, setCurrentOver] = useState(1);
  const [currentBall, setCurrentBall] = useState(0);

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

    } catch (error) {
      console.error("Error fetching match:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBallHistory = async () => {
    const response = await fetch(`/api/matches/${matchId}/ball`);
    const data = await response.json();
        updateCurrentInnings(data);
  }

  const updateCurrentInnings = async (data) => {
    console.log("current innings data", data?.ball);
    setCurrentInnings(data?.ball);
    setCurrentOver(data?.ball?.over || 1);
    setBallHistory(data?.ball?.bowling?.currentOverStats?.balls);
    setCurrentBall(data?.ball?.bowling?.currentOverStats?.balls?.length || 0);
  }

  const recordBall = async (ballData) => {
    try {
      // Compute ball number
      if(ballData?.isValidBall && currentBall == 6){
         alert("please change bowler")
        return setShowPlayerPanel(true)
      }


      let ballNumber = (currentBall || 0) + 1;
      let updatedStriker = striker;
      let updatedNonStriker = nonStriker;

      if (ballData.isValidBall) {
        // rotate on odd runs
        if (ballData.runs % 2 === 1 && ballNumber <= 6) {
          const temp = updatedStriker;
          updatedStriker = updatedNonStriker;
          updatedNonStriker = temp;
        }

        // Increment over if last ball of over
        if (ballNumber > 6) {
          ballNumber = 1
          setCurrentOver(currentOver + 1);
        }

      }

      const response = await fetch(`/api/matches/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ballData,
          match_id: matchId,
          innings_id: 1,
          over: currentOver,
          ballNumber,
          striker: striker.name,
          nonStriker: nonStriker.name,
          bowler: currentBowler.name,
        }),
      });

      if (response.ok) {
        const updatedInnings = await response.json();
        updateCurrentInnings(updatedInnings);
        setStriker(updatedStriker);
        setNonStriker(updatedNonStriker);
        setCurrentBall(ballNumber);
      }
    } catch (error) {
      console.error("Error recording ball:", error);
    }
  };

  const calculateCRR = () => {
    console.log(currentInnings,"crr")
    if(currentInnings?.ballNumber < 6)
      return '0.00'

    const totalRuns = currentInnings?.totalRuns || 0;
    // Calculate overs faced as: completed overs + fraction of current over
    const oversCompleted = currentInnings?.ballNumber / 6;
    const ballsInCurrentOver = currentBall || 0;
    let oversFaced = oversCompleted + ballsInCurrentOver / 6;

    if (oversCompleted == 1)
        oversFaced = 1

    console.log("CRR", { totalRuns, oversFaced, oversCompleted, ballsInCurrentOver });

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

      if (response.ok) {
        await fetchMatch();
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

    const prevBowling = currentInnings?.bowling || {}; // fallback if undefined
    const prevOverStats = prevBowling.currentOverStats || { balls: [] };

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
              ({(currentInnings?.over - 1) || 0}.{currentInnings?.ballNumber || 0}/{match.matchType === "T20" ? "20" : "50"} Overs)
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
              onClick={() => setShowExtrasPanel(true)}
              className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all"
            >
              Extras
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
              onClick={() => setShowPlayerPanel(true)}
              className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all"
            >
              Update players
            </button>
            <button className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all">
              5/7/P
            </button>
            <button className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all">
              Options
            </button>
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

// Player Panel Component (Updated with Proper Dropdown Alignment)
function PlayerPanel({ onClose, striker, nonStriker, bowler, setStriker, setNonStriker, setBowler, setBallHistory }) {
  const players = ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 relative">
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

        {/* Player Dropdowns */}
        <div className="space-y-4">
          <div className="flex flex-col text-left">
            <label className="text-slate-300 mb-1">Striker</label>
            <select
              onChange={(e) => setStriker({name: e.target.value})}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={striker.name}
            >
              {players.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col text-left">
            <label className="text-slate-300 mb-1">Non-Striker</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={nonStriker.name}
              onChange={(e) => setNonStriker({name: e.target.value})}
            >
              {players.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col text-left">
            <label className="text-slate-300 mb-1">Bowler</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={bowler.name}
              onChange={(e) => {
                setBowler({name: e.target.value})
                setBallHistory([])
              }}
            >
              {players.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

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



