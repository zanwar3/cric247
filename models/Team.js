import mongoose, { Schema } from "mongoose";

const TeamSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: [true, 'Team name is required'], trim: true },
  slug: { 
    type: String, 
    required: [true, 'Team slug is required'], 
    trim: true, 
    uppercase: true,
    maxlength: [4, 'Slug cannot be more than 3 characters'],
    minlength: [2, 'Slug must be at least 2 characters']
  },
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
  isActive: { type: Boolean, default: true },
  players: [{
    player: { type: Schema.Types.ObjectId, ref: 'Profile' },
    role: { type: String, default: 'Batsman' },
    joinedDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }]
}, { timestamps: true });

// Compound unique index for user-scoped uniqueness
TeamSchema.index({ user: 1, name: 1 }, { unique: true });
TeamSchema.index({ user: 1, slug: 1 }, { unique: true });

// Virtual for win percentage
TeamSchema.virtual('winPercentage').get(function() {
  if (this.statistics.matchesPlayed === 0) return 0;
  return ((this.statistics.matchesWon / this.statistics.matchesPlayed) * 100).toFixed(2);
});

// Ensure virtual fields are serialized
TeamSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);