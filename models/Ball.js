import mongoose, { Schema } from "mongoose";

const BallSchema = new Schema(
  {
    match_id: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    innings_id: {
      type: String,
      required: true,
    },
    over: {
      type: Number,
      required: true,
    },
    ballNumber: {
      type: Number,
      required: true, // 1 to 6 (or more if extras)
    },
    batting: [
      {
        player: { type: String, required: true },
        runs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 }
      }
    ],
    // Bowling info
    bowling:
      {
        bowler: { type: String, required: true },
        totalRuns: { type: Number, default: 0 },
        totalBallBowled: { type: Number, default: 0 },   // runs conceded on this ball
        currentOverStats: { type: Object, default: {} }
      },

    striker: { type: String, default: null },     // just player name/id
    nonStriker: { type: String, default: null } ,
    bowler: {
      type: String,
      required: true,
    },
    runs: {
      type: Number,
      default: 0,
    },
    totalRuns: {
      type: Number,
      default: 0,
    },
    totalBalls: {
      type: Number,
      default: 0,
    },
    isValidBall: {
      type: Boolean,
      default: true,
    },
    extras: {
      wide: { type: Boolean, default: false },
      noBall: { type: Boolean, default: false },
      bye: { type: Boolean, default: false },
      legBye: { type: Boolean, default: false },
    },
    wicket: {
      isWicket: { type: Boolean, default: false },
      dismissalType: { type: String, enum: [null, "Bowled", "Caught", "LBW", "Stumped", "Run Out", "Hit Wicket", "Obstructing"], default: null },
      batsmanOut: { type: String, default: null },
    },
    totalWickets: {
      type: Number,
      default: 0,
    },
    commentary: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Ball || mongoose.model("Ball", BallSchema);
