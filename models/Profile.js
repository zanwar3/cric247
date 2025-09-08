import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema({
  fullName: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  city: String,
  mobileNumber: String,
  email: { type: String, required: true },
  primaryRole: {
    type: String,
    enum: ["Top-Order Batter", "Middle-Order Batter", "All-Rounder", "Wicketkeeper-Batter", "Bowler"],
    required: true,
  },
  battingHand: { type: String, enum: ["Right-Handed", "Left-Handed"] },
  bowlingHand: { type: String, enum: ["Right-Handed", "Left-Handed"] },
  bowlingStyle: String,
}, { timestamps: true });

export default mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);