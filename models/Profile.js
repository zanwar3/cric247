import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
  city: String,
  age: String,
  phone: String,
  experience: String,
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-keeper"],
    required: true,
  },
  battingStyle: { type: String, enum: ["Right-Handed", "Left-Handed"] },
  bowlingStyle: String,
}, { timestamps: true });

// Compound unique index for user-scoped uniqueness
ProfileSchema.index({ user: 1, email: 1 }, { unique: true });

export default mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);