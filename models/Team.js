import mongoose, { Schema } from "mongoose";

const TeamSchema = new Schema({
  name: { type: String, required: [true, 'Team name is required'], unique: true, trim: true },
  city: { type: String, trim: true },
  description: { type: String, trim: true },
  founded: { type: String, trim: true },
  homeGround: { type: String, trim: true },
  captain: { type: String, trim: true },
  coach: { type: String, trim: true },
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    matchesWon: { type: Number, default: 0 },
    matchesLost: { type: Number, default: 0 },
    matchesDrawn: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Virtual for win percentage
TeamSchema.virtual('winPercentage').get(function() {
  if (this.statistics.matchesPlayed === 0) return 0;
  return ((this.statistics.matchesWon / this.statistics.matchesPlayed) * 100).toFixed(2);
});

// Ensure virtual fields are serialized
TeamSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);


