import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Ball from "@/models/Ball";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse, checkResourceOwnership } from "@/lib/auth-utils";

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const ballData = await request.json();
    const { id } = await params;

    // Check if match belongs to user
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }


    // Find the ball and verify it belongs to the user
    const ballToDelete = await Ball.findOne({
      _id: ballData._id,
      user: user.id,
    });
    if (!ballToDelete) {
      return NextResponse.json({ error: "Ball data not found" }, { status: 404 });
    }

    // Delete the ball
    const ball = await Ball.deleteOne({ 
      _id: ballData._id,
      user: user.id // Additional safety check
    });

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