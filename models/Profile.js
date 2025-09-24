import mongoose, { Schema } from "mongoose";

const ProfileSchema = new Schema({
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

export default mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);
