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
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  matchNumber: String, // e.g., "Match 1", "Semi Final 1", "Final"
  tournament: {
    _id: { type: Schema.Types.ObjectId, ref: "Tournament" },
    name: String
  },
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
      ballsFaced: { type: Number, default: 0 },
      fours: { type: Number, default: 0 },
      sixes: { type: Number, default: 0 },
      strikeRate: { type: Number, default: 0 },
      isOut: { type: Boolean, default: false },
      dismissalType: String,
      bowlerOut: { type: Schema.Types.ObjectId, ref: "Profile" },
      fielderOut: { type: Schema.Types.ObjectId, ref: "Profile" }
    }],
    bowling: [{
      player: { type: Schema.Types.ObjectId, ref: "Profile" },
      overs: { type: Number, default: 0 },
      maidens: { type: Number, default: 0 },
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      economy: { type: Number, default: 0 }
    }],
    balls: [BallSchema],
    isCompleted: { type: Boolean, default: false },
    target: Number // For second innings
  }],
  result: {
    winner: { type: Schema.Types.ObjectId, ref: "Team" },
    winBy: String, // "runs", "wickets", "tie", "no result"
    margin: Number, // runs or wickets
    manOfTheMatch: { type: Schema.Types.ObjectId, ref: "Profile" }
  },
  weather: {
    condition: String,
    temperature: Number,
    humidity: Number,
    windSpeed: Number
  },
  umpires: [{
    name: String,
    role: { type: String, enum: ["Field", "Third", "Reserve"] }
  }],
  notes: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index for user-scoped data
MatchSchema.index({ user: 1, createdAt: -1 });

// Virtual for match duration
MatchSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Virtual for current status
MatchSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (this.status === "Completed") return "Completed";
  if (this.status === "Live") return "Live";
  if (this.scheduledDate > now) return "Upcoming";
  return "Scheduled";
});

// Ensure virtual fields are serialized
MatchSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Match || mongoose.model("Match", MatchSchema);