import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

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

    // Find match and check ownership
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    });

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Validate required fields
    if (!data.tossWinner || !data.tossDecision) {
      return Response.json({ 
        error: 'Toss winner and decision are required' 
      }, { status: 400 });
    }

    if (!data.matchSquad || !data.matchSquad.teamA || !data.matchSquad.teamB) {
      return Response.json({ 
        error: 'Match squad for both teams is required' 
      }, { status: 400 });
    }

    // Validate team A squad
    const teamAPlayers = data.matchSquad.teamA.players || [];
    const teamACaptains = teamAPlayers.filter(p => p.isCaptain);
    const teamAKeepers = teamAPlayers.filter(p => p.isKeeper);

    if (teamAPlayers.length === 0) {
      return Response.json({ 
        error: 'Team A must have at least one player' 
      }, { status: 400 });
    }

    if (teamACaptains.length !== 1) {
      return Response.json({ 
        error: 'Team A must have exactly one captain' 
      }, { status: 400 });
    }

    if (teamAKeepers.length !== 1) {
      return Response.json({ 
        error: 'Team A must have exactly one wicket keeper' 
      }, { status: 400 });
    }

    // Validate team B squad
    const teamBPlayers = data.matchSquad.teamB.players || [];
    const teamBCaptains = teamBPlayers.filter(p => p.isCaptain);
    const teamBKeepers = teamBPlayers.filter(p => p.isKeeper);

    if (teamBPlayers.length === 0) {
      return Response.json({ 
        error: 'Team B must have at least one player' 
      }, { status: 400 });
    }

    if (teamBCaptains.length !== 1) {
      return Response.json({ 
        error: 'Team B must have exactly one captain' 
      }, { status: 400 });
    }

    if (teamBKeepers.length !== 1) {
      return Response.json({ 
        error: 'Team B must have exactly one wicket keeper' 
      }, { status: 400 });
    }

    // Validate both teams have same number of players
    if (teamAPlayers.length !== teamBPlayers.length) {
      return Response.json({ 
        error: 'Both teams must have the same number of players' 
      }, { status: 400 });
    }

    // Update match with setup data
    match.tossWinner = data.tossWinner;
    match.tossDecision = data.tossDecision;
    match.playersPerTeam = teamAPlayers.length;
    
    // Set match squad with captain and keeper
    match.matchSquad = {
      teamA: {
        players: teamAPlayers,
        captain: teamACaptains[0].player,
        keeper: teamAKeepers[0].player
      },
      teamB: {
        players: teamBPlayers,
        captain: teamBCaptains[0].player,
        keeper: teamBKeepers[0].player
      }
    };

    // Update overs limit if provided
    if (data.oversLimit) {
      match.oversLimit = data.oversLimit;
    }

    // Update status to Ready
    match.status = "Ready";

    await match.save();

    return Response.json({ 
      success: true,
      message: 'Match setup completed successfully',
      match 
    });

  } catch (error) {
    console.error('Error setting up match:', error);
    return Response.json({ 
      error: 'Failed to setup match',
      details: error.message 
    }, { status: 500 });
  }
}

