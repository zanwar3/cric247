import mongoose, { Schema } from "mongoose";

const TournamentSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  format: {
    type: String,
    enum: ["Round Robin", "Knockout", "League + Knockout", "T20", "ODI", "Test"],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: Date,
  registrationDeadline: Date,
  venue: String,
  organizer: {
    name: String,
    email: String,
    phone: String
  },
  prizePool: {
    total: Number,
    winner: Number,
    runnerUp: Number,
    other: String // For other prizes description
  },
  entryFee: { type: Number, default: 0 },
  maxTeams: { type: Number, default: 16 },
  minTeams: { type: Number, default: 4 },
  teams: [{
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    registrationDate: { type: Date, default: Date.now },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending"
    },
    groupStage: {
      group: String, // A, B, C, etc.
      points: { type: Number, default: 0 },
      matchesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      netRunRate: { type: Number, default: 0 }
    }
  }],
  matches: [{ type: Schema.Types.ObjectId, ref: "Match" }],
  status: {
    type: String,
    enum: ["Draft", "Registration Open", "Registration Closed", "Ongoing", "Completed", "Cancelled"],
    default: "Draft"
  },
  rules: {
    oversPerMatch: { type: Number, default: 20 },
    playersPerTeam: { type: Number, default: 11 },
    maxOversPerBowler: Number,
    powerplayOvers: Number,
    duckworthLewis: { type: Boolean, default: false },
    supersOver: { type: Boolean, default: false }
  },
  winner: { type: Schema.Types.ObjectId, ref: "Team" },
  runnerUp: { type: Schema.Types.ObjectId, ref: "Team" },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual for tournament progress
TournamentSchema.virtual('registrationProgress').get(function() {
  return `${this.teams.length}/${this.maxTeams}`;
});

TournamentSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return this.status === "Registration Open" && 
         (!this.registrationDeadline || now <= this.registrationDeadline) &&
         this.teams.length < this.maxTeams;
});

// Ensure virtual fields are serialized
TournamentSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Tournament || mongoose.model("Tournament", TournamentSchema);


