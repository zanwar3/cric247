import dbConnect from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Match from "@/models/Match";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/auth-utils";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Check if match belongs to user
    const match = await Match.findById({
      _id: id,
      user: user.id,
    });
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get the latest ball for this match and user
    const ball = await Ball.findOne({ 
      match_id: id,
      user: user.id 
    }).sort({ createdAt: -1 });

    if (!ball) {
      return Response.json({ success: false, message: "No ball data found" });
    }

    return Response.json({ success: true, ball });
  } catch (error) {
    console.error('Error fetching ball data:', error);
    return Response.json({ error: 'Failed to fetch ball data' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;
    const data = await request.json();

    // Check if match belongs to user
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    });
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }


    // Create ball data with user reference
    const ballData = {
      user: user.id, // Add user reference
      match_id: id,
      ...data
    };

   

    // Create new ball entry
    const newBall = await Ball.create(ballData);

    return Response.json({ success: true, ball: newBall });
  } catch (error) {
    console.error('Error creating ball data:', error);
    return Response.json({ error: 'Failed to create ball data' }, { status: 500 });
  }
}