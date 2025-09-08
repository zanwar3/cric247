"use client";
import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";

export default function DemoScorePage() {
  // Demo match state
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    overs: 0,
    ballsInOver: 0,
    extras: { byes: 0, legByes: 0, wides: 0, noBalls: 0 }
  });
  
  const [currentOver, setCurrentOver] = useState([]);
  const [allOvers, setAllOvers] = useState([]);
  const [ballHistory, setBallHistory] = useState([]);
  
  // Current players (demo data)
  const [striker, setStriker] = useState({ name: "Virat Kohli", runs: 45, balls: 32 });
  const [nonStriker, setNonStriker] = useState({ name: "Rohit Sharma", runs: 28, balls: 24 });
  const [bowler, setBowler] = useState({ name: "Jasprit Bumrah", overs: 3, runs: 18, wickets: 2 });
  
  // UI state
  const [showWicketPanel, setShowWicketPanel] = useState(false);
  const [showExtrasPanel, setShowExtrasPanel] = useState(false);
  const [showPlayerPanel, setShowPlayerPanel] = useState(false);

  const totalBalls = score.overs * 6 + score.ballsInOver;
  const runRate = totalBalls > 0 ? (score.runs / (totalBalls / 6)).toFixed(2) : "0.00";
  
  const recordBall = (ballData) => {
    const newBall = {
      id: Date.now(),
      runs: ballData.runs || 0,
      extraRuns: ballData.extraRuns || 0,
      type: ballData.type || "legal",
      isWicket: ballData.isWicket || false,
      extras: ballData.extras || null,
      timestamp: new Date()
    };
    
    // Add to current over
    const newCurrentOver = [...currentOver, newBall];
    setCurrentOver(newCurrentOver);
    
    // Add to ball history
    setBallHistory(prev => [...prev, newBall]);
    
    // Update score
    const newScore = { ...score };
    newScore.runs += ballData.runs || 0;
    if (ballData.extraRuns) newScore.runs += ballData.extraRuns;
    if (ballData.isWicket) newScore.wickets += 1;
    
    // Handle extras
    if (ballData.extras) {
      switch (ballData.extras) {
        case "wide":
          newScore.extras.wides += ballData.extraRuns || 1;
          break;
        case "noball":
          newScore.extras.noBalls += ballData.extraRuns || 1;
          break;
        case "bye":
          newScore.extras.byes += ballData.extraRuns || 1;
          break;
        case "legbye":
          newScore.extras.legByes += ballData.extraRuns || 1;
          break;
      }
    }
    
    // Update balls (only for legal balls)
    if (!["wide", "noball"].includes(ballData.extras)) {
      newScore.ballsInOver += 1;
      
      // Check if over is complete
      if (newScore.ballsInOver === 6) {
        newScore.overs += 1;
        newScore.ballsInOver = 0;
        
        // Move current over to completed overs
        setAllOvers(prev => [...prev, newCurrentOver]);
        setCurrentOver([]);
      }
    }
    
    setScore(newScore);
    
    // Update striker stats (demo)
    if (!ballData.isWicket && ballData.type !== "extras") {
      setStriker(prev => ({
        ...prev,
        runs: prev.runs + (ballData.runs || 0),
        balls: prev.balls + 1
      }));
    }
  };

  const handleRunsScored = (runs) => {
    recordBall({ runs, type: "legal" });
  };

  const handleWicket = (wicketData) => {
    recordBall({ runs: 0, type: "legal", isWicket: true, wicketData });
    setShowWicketPanel(false);
  };

  const handleExtras = (extraData) => {
    recordBall({ 
      runs: 0, 
      extraRuns: extraData.runs,
      type: "extras", 
      extras: extraData.type 
    });
    setShowExtrasPanel(false);
  };

  const handleQuickExtra = (type, runs = 1) => {
    recordBall({ 
      runs: 0, 
      extraRuns: runs,
      type: "extras", 
      extras: type 
    });
  };

  const undoLastBall = () => {
    if (ballHistory.length === 0) return;
    
    const lastBall = ballHistory[ballHistory.length - 1];
    
    // Remove from history
    setBallHistory(prev => prev.slice(0, -1));
    
    // Remove from current over
    setCurrentOver(prev => prev.slice(0, -1));
    
    // Reverse score changes
    const newScore = { ...score };
    newScore.runs -= (lastBall.runs || 0) + (lastBall.extraRuns || 0);
    if (lastBall.isWicket) newScore.wickets -= 1;
    
    // Reverse extras
    if (lastBall.extras) {
      switch (lastBall.extras) {
        case "wide":
          newScore.extras.wides -= (lastBall.extraRuns || 1);
          break;
        case "noball":
          newScore.extras.noBalls -= (lastBall.extraRuns || 1);
          break;
        case "bye":
          newScore.extras.byes -= (lastBall.extraRuns || 1);
          break;
        case "legbye":
          newScore.extras.legByes -= (lastBall.extraRuns || 1);
          break;
      }
    }
    
    // Reverse ball count (only for legal balls)
    if (!["wide", "noball"].includes(lastBall.extras)) {
      if (newScore.ballsInOver > 0) {
        newScore.ballsInOver -= 1;
      } else if (newScore.overs > 0) {
        newScore.overs -= 1;
        newScore.ballsInOver = 5;
        // Move last completed over back to current over
        if (allOvers.length > 0) {
          const lastCompletedOver = allOvers[allOvers.length - 1];
          setAllOvers(prev => prev.slice(0, -1));
          setCurrentOver(lastCompletedOver.slice(0, -1));
        }
      }
    }
    
    setScore(newScore);
  };

  return (
    <MobileLayout>
      <div className="min-h-screen bg-slate-900">
        {/* Live Score Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="text-center">
            <h1 className="text-slate-100 font-bold text-lg">Demo Match - India vs Australia</h1>
            <div className="text-3xl font-bold text-blue-400 mt-2">
              {score.runs}/{score.wickets}
            </div>
            <div className="text-slate-300 text-sm">
              ({score.overs}.{score.ballsInOver}/20 Overs)
            </div>
            <div className="text-slate-400 text-xs mt-1">
              CRR: {runRate} • RRR: {((180 - score.runs) / ((20 - score.overs) - (score.ballsInOver / 6))).toFixed(2)}
            </div>
          </div>

          {/* Current Players */}
          <div className="flex justify-between mt-4 text-sm">
            <div className="text-slate-300">
              <div className="font-medium">{striker.name} *</div>
              <div className="text-xs text-slate-400">{striker.runs} ({striker.balls})</div>
            </div>
            <div className="text-slate-300 text-right">
              <div className="font-medium">{nonStriker.name}</div>
              <div className="text-xs text-slate-400">{nonStriker.runs} ({nonStriker.balls})</div>
            </div>
          </div>
          
          <div className="text-center mt-2 text-sm text-slate-300">
            <span className="font-medium">{bowler.name}</span>
            <span className="text-slate-400 text-xs ml-2">{bowler.overs}-{bowler.runs}-{bowler.wickets}</span>
          </div>
        </div>

        {/* Current Over Display */}
        <div className="bg-slate-700 p-3 border-b border-slate-600">
          <div className="text-center">
            <div className="text-slate-200 text-sm font-medium mb-2">This Over</div>
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }, (_, i) => {
                const ball = currentOver[i];
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      ball
                        ? ball.isWicket
                          ? "bg-red-600 text-white"
                          : ball.runs === 4
                          ? "bg-green-600 text-white"
                          : ball.runs === 6
                          ? "bg-purple-600 text-white"
                          : ball.extras
                          ? "bg-orange-600 text-white"
                          : "bg-blue-600 text-white"
                        : "bg-slate-600 text-slate-400"
                    }`}
                  >
                    {ball ? (
                      ball.isWicket ? "W" : 
                      ball.extras ? (
                        ball.extras === "wide" ? "Wd" :
                        ball.extras === "noball" ? "Nb" :
                        ball.extras === "bye" ? "B" :
                        ball.extras === "legbye" ? "Lb" : "E"
                      ) : ball.runs
                    ) : "•"}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Extras Summary */}
        <div className="bg-slate-600 p-2 border-b border-slate-500">
          <div className="flex justify-center space-x-4 text-xs text-slate-300">
            <span>B: {score.extras.byes}</span>
            <span>LB: {score.extras.legByes}</span>
            <span>W: {score.extras.wides}</span>
            <span>NB: {score.extras.noBalls}</span>
            <span>Total Extras: {Object.values(score.extras).reduce((a, b) => a + b, 0)}</span>
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
                className={`h-16 rounded-lg font-bold text-lg transition-all active:scale-95 ${
                  runs === 0
                    ? "bg-slate-600 hover:bg-slate-500 text-white"
                    : runs === 4
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/25"
                    : runs === 6
                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                } shadow-lg`}
              >
                {runs}
              </button>
            ))}
            
            {/* Wicket Button */}
            <button
              onClick={() => setShowWicketPanel(true)}
              className="h-16 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all active:scale-95 shadow-lg shadow-red-500/25"
            >
              OUT
            </button>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button 
              onClick={() => handleQuickExtra("wide", 1)}
              className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg"
              title="Wide Ball (+1 run)"
            >
              <div className="text-center">
                <div className="font-bold">WD</div>
                <div className="text-xs opacity-80">+1</div>
              </div>
            </button>
            <button 
              onClick={() => handleQuickExtra("noball", 1)}
              className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg"
              title="No Ball (+1 run)"
            >
              <div className="text-center">
                <div className="font-bold">NB</div>
                <div className="text-xs opacity-80">+1</div>
              </div>
            </button>
            <button 
              onClick={() => handleQuickExtra("bye", 1)}
              className="h-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg"
              title="Bye (+1 run)"
            >
              <div className="text-center">
                <div className="font-bold">BYE</div>
                <div className="text-xs opacity-80">+1</div>
              </div>
            </button>
            <button 
              onClick={() => handleQuickExtra("legbye", 1)}
              className="h-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95 shadow-lg"
              title="Leg Bye (+1 run)"
            >
              <div className="text-center">
                <div className="font-bold">LB</div>
                <div className="text-xs opacity-80">+1</div>
              </div>
            </button>
          </div>

          {/* Extras and Actions */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setShowExtrasPanel(true)}
              className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all active:scale-95"
            >
              Extras
            </button>
            <button
              onClick={undoLastBall}
              disabled={ballHistory.length === 0}
              className="h-12 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-all active:scale-95"
            >
              UNDO
            </button>
            <button className="h-12 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all">
              5/7/P
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowPlayerPanel(true)}
              className="h-10 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-all"
            >
              Scoring Shortcuts
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
            striker={striker}
            bowler={bowler}
          />
        )}

        {/* Extras Panel */}
        {showExtrasPanel && (
          <ExtrasPanel
            onClose={() => setShowExtrasPanel(false)}
            onExtra={handleExtras}
          />
        )}

        {/* Scoring Shortcuts Panel */}
        {showPlayerPanel && (
          <ScoringShortcutsPanel
            onClose={() => setShowPlayerPanel(false)}
          />
        )}
      </div>
    </MobileLayout>
  );
}

// Wicket Panel Component
function WicketPanel({ onClose, onWicket, striker, bowler }) {
  const [dismissalType, setDismissalType] = useState("");
  const [fielder, setFielder] = useState("");

  const dismissalTypes = [
    "Bowled", "Caught", "LBW", "Stumped", "Run Out", "Hit Wicket", "Obstructing"
  ];

  const handleSubmit = () => {
    if (dismissalType) {
      onWicket({
        dismissalType,
        bowler: ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"].includes(dismissalType) ? bowler.name : null,
        fielder: fielder || null,
        batsmanOut: striker.name
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

        <div className="mb-4 p-3 bg-slate-700 rounded-lg">
          <p className="text-slate-200 text-sm">
            <span className="font-medium">{striker.name}</span> is out
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Dismissal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {dismissalTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setDismissalType(type)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    dismissalType === type
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
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400"
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
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    extraType === extra.type
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
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Total Runs {extraType && (extraType === "wide" || extraType === "noball") && "(includes penalty)"}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((runValue) => (
                <button
                  key={runValue}
                  onClick={() => setRuns(runValue)}
                  className={`w-12 h-12 rounded-lg font-bold transition-all ${
                    runs === runValue
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {runValue}
                </button>
              ))}
            </div>
            {extraType && (extraType === "wide" || extraType === "noball") && (
              <p className="text-xs text-slate-400 mt-2">
                For {extraType === "wide" ? "Wide" : "No Ball"}: 1 = penalty only, 2+ = penalty + runs scored
              </p>
            )}
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

// Scoring Shortcuts Panel
function ScoringShortcutsPanel({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-100">Scoring Shortcuts</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>WD</span>
            <span>Wide (1 run + extra)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>NB</span>
            <span>No Ball (1 run + extra)</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>BYE</span>
            <span>Bye runs</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>LB</span>
            <span>Leg Bye runs</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>5/7/P</span>
            <span>5 penalty / 7 penalty / Penalty</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>OUT</span>
            <span>Wicket with dismissal options</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>UNDO</span>
            <span>Remove last ball instantly</span>
          </div>
        </div>

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
