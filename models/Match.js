import mongoose, { Schema } from "mongoose";

// Ball-by-ball scoring schema
const BallSchema = new Schema({
  ballNumber: { type: Number, required: true }, // Ball number in the over (1-6)
  over: { type: Number, required: true }, // Over number
  bowler: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  batsman: { type: Schema.Types.ObjectId, ref: "Profile", required: true }, // Striker
  nonStriker: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  runs: { type: Number, default: 0 }, // Runs scored off the bat
  totalRuns: { type: Number, default: 0 }, // Total runs including extras
  ballType: {
    type: String,
    enum: ["legal", "wide", "noball", "bye", "legbye"],
    default: "legal"
  },
  extras: {
    isExtra: { type: Boolean, default: false },
    type: { type: String, enum: ["wide", "noball", "bye", "legbye"], default: null },
    runs: { type: Number, default: 0 }
  },
  wicket: {
    isWicket: { type: Boolean, default: false },
    dismissalType: { 
      type: String, 
      enum: ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Obstructing", "Retired"], 
      default: null 
    },
    bowler: { type: Schema.Types.ObjectId, ref: "Profile", default: null },
    fielder: { type: Schema.Types.ObjectId, ref: "Profile", default: null },
    batsmanOut: { type: Schema.Types.ObjectId, ref: "Profile", default: null }
  },
  commentary: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
  isValidBall: { type: Boolean, default: true } // False for wides, no-balls
});

const MatchSchema = new Schema({
  matchNumber: String, // e.g., "Match 1", "Semi Final 1", "Final"
  tournament: { type: Schema.Types.ObjectId, ref: "Tournament" },
  teams: {
    teamA: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    teamB: { type: Schema.Types.ObjectId, ref: "Team", required: true }
  },
  venue: {
    name: String,
    city: String,
    capacity: Number
  },
  scheduledDate: { type: Date, required: true },
  actualStartTime: Date,
  actualEndTime: Date,
  status: {
    type: String,
    default: "Scheduled"
  },
  matchType: {
    type: String,
    default: "T20"
  },
  tossWinner: { type: Schema.Types.ObjectId, ref: "Team" },
  tossDecision: { type: String, enum: ["Bat", "Bowl"] },
  innings: [{
    inningNumber: { type: Number, required: true }, // 1 or 2
    battingTeam: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    bowlingTeam: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOvers: { type: Number, default: 0 },
    totalBalls: { type: Number, default: 0 },
    extras: {
      byes: { type: Number, default: 0 },
      legByes: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      penalties: { type: Number, default: 0 }
    },
    batting: [{
      player: { type: Schema.Types.ObjectId, ref: "Profile" },
      battingOrder: Number,
      runs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      dismissal: {
        type: { 
          type: String, 
          enum: ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Not Out", "Retired"]
        },
        bowler: { type: Schema.Types.ObjectId, ref: "Profile" },
        fielder: { type: Schema.Types.ObjectId, ref: "Profile" }
      },
      strikeRate: { type: Number, default: 0 }
    }],
    bowling: [{
      player: { type: Schema.Types.ObjectId, ref: "Profile" },
      overs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      economy: { type: Number, default: 0 }
    }],
    ballByBall: [BallSchema], // Ball-by-ball scoring
    currentBatsmen: {
      striker: { type: Schema.Types.ObjectId, ref: "Profile" },
      nonStriker: { type: Schema.Types.ObjectId, ref: "Profile" }
    },
    currentBowler: { type: Schema.Types.ObjectId, ref: "Profile" },
    isCompleted: { type: Boolean, default: false }
  }],
  result: {
    winner: { type: Schema.Types.ObjectId, ref: "Team" },
    winType: { 
      type: String, 
      enum: ["Runs", "Wickets", "No Result", "Tie", "Draw"] 
    },
    winMargin: Number, // runs or wickets
    playerOfTheMatch: { type: Schema.Types.ObjectId, ref: "Profile" }
  },
  officials: {
    umpire1: String,
    umpire2: String,
    thirdUmpire: String,
    matchReferee: String,
    scorer: String
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number
  },
  notes: String
}, { timestamps: true });

// Virtual for current score display
MatchSchema.virtual('currentScore').get(function() {
  if (this.innings.length === 0) return "Match not started";
  
  const latestInning = this.innings[this.innings.length - 1];
  return `${latestInning.totalRuns}/${latestInning.totalWickets} (${latestInning.totalOvers}.${latestInning.totalBalls % 6})`;
});

// Ensure virtual fields are serialized
MatchSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);


