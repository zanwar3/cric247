import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Fetch only matches belonging to the authenticated user
    const matches = await Match.find({ user: user.id })
      .sort({ scheduledDate: -1 });
    
    return Response.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(req);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const data = await req.json();
    
    const matchData = {
      user: user.id, // Add user reference
      matchNumber: data.matchNumber || '',
      tournament: data.tournament || null,
      teams: {
        teamA: data.teams.teamA,
        teamB: data.teams.teamB
      },
      venue: data.venue || {},
      scheduledDate: new Date(data.scheduledDate),
      status: data.status || 'Scheduled',
      matchType: data.matchType || 'T20',
      officials: data.officials || {},
      notes: data.notes || ''
    };

    const newMatch = await Match.create(matchData);
    
    // Populate the created match before returning
    const populatedMatch = await Match.findById(newMatch._id)    
    return Response.json(populatedMatch, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create match' }, { status: 500 });
  }
}