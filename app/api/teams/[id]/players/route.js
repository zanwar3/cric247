import dbConnect from "@/lib/mongodb";
import { Team } from "@/lib/models";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse, checkResourceOwnership } from "@/lib/auth-utils";

// Add player to team
export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;
    const { playerId, role } = await request.json();

    // Find team and check ownership
    const team = await Team.findOne({
      _id: id,
      user: user.id,
    });
    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if player is already in the team
    const existingPlayer = team.players.find(p => p.player.toString() === playerId);
    if (existingPlayer) {
      return Response.json({ error: 'Player already in team' }, { status: 400 });
    }

    // Add player to team
    team.players.push({
      player: playerId,
      role: role || 'Batsman',
      joinedDate: new Date(),
      isActive: true
    });

    await team.save();

    // Return updated team with populated players
    const updatedTeam = await Team.findById(id)
      .populate('players.player', 'name role');

    return Response.json(updatedTeam);
  } catch (error) {
    console.error('Error adding player to team:', error);
    return Response.json({ error: 'Failed to add player to team' }, { status: 500 });
  }
}

// Remove player from team
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;
    const { playerId } = await request.json();

    // Find team and check ownership
    const team = await Team.findById(id);
    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }


    // Remove player from team
    team.players = team.players.filter(p => p.player.toString() !== playerId);

    // If removing captain or vice-captain, clear those fields
    if (team.captain && team.captain.toString() === playerId) {
      team.captain = null;
    }
    if (team.viceCaptain && team.viceCaptain.toString() === playerId) {
      team.viceCaptain = null;
    }

    await team.save();

    // Return updated team with populated players
    const updatedTeam = await Team.findById(id)
      .populate('players.player', 'name role');

    return Response.json(updatedTeam);
  } catch (error) {
    console.error('Error removing player from team:', error);
    return Response.json({ error: 'Failed to remove player from team' }, { status: 500 });
  }
}