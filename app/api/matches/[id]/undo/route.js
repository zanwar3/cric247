import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Ball from "@/models/Ball";

export async function POST(request, { params }) {
  try {
    await dbConnect();
    const ballData = await request.json();
    const { id } = await params;

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const ball = await Ball.deleteOne({ _id: ballData._id });

    return NextResponse.json({
      success: true,
      match,
      undoneAt: new Date(),
      removedBall: ball
    });

  } catch (error) {
    console.error("Error undoing ball:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
