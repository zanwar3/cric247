import dbConnect from "@/lib/mongodb";
import { Tournament } from "@/lib/models";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Fetch only tournaments belonging to the authenticated user
    const tournaments = await Tournament.find({ user: user.id })
      .sort({ createdAt: -1 });

    return Response.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return Response.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
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
    
    // Create tournament with user reference
    const tournamentData = {
      user: user.id, // Add user reference
      ...data
    };

    const newTournament = await Tournament.create(tournamentData);

    // Populate the created tournament before returning
    const populatedTournament = await Tournament.findById(newTournament._id)

    return Response.json(populatedTournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Tournament name already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}