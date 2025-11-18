import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse, checkResourceOwnership } from "@/lib/auth-utils";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Find match and check ownership
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    })
      .populate('teams.teamA')
      .populate('teams.teamB')
      .populate('matchSquad.teamA.players.player')
      .populate('matchSquad.teamB.players.player');

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchObj = match.toObject();
    
    // Check if innings has started (has current players set)
    const currentInnings = match.innings && match.innings.length > 0 
      ? match.innings[match.currentInnings - 1] 
      : null;
    
    matchObj.isStarted = !!(
      currentInnings && 
      (currentInnings.currentStriker || 
       currentInnings.currentNonStriker || 
       currentInnings.currentBowler)
    );

    // Simplify team data to just name and _id
    if (matchObj.teams?.teamA && typeof matchObj.teams.teamA === 'object') {
      matchObj.teams.teamA = {
        _id: matchObj.teams.teamA._id,
        name: matchObj.teams.teamA.name
      };
    }
    if (matchObj.teams?.teamB && typeof matchObj.teams.teamB === 'object') {
      matchObj.teams.teamB = {
        _id: matchObj.teams.teamB._id,
        name: matchObj.teams.teamB.name
      };
    }

    // Flatten player structure for teamA
    if (matchObj.matchSquad?.teamA?.players) {
      matchObj.matchSquad.teamA.players = matchObj.matchSquad.teamA.players.map(playerEntry => {
        if (playerEntry.player && typeof playerEntry.player === 'object') {
          return {
            _id: playerEntry.player._id,
            name: playerEntry.player.name,
            email: playerEntry.player.email,
            role: playerEntry.player.role,
            gender: playerEntry.player.gender,
            city: playerEntry.player.city,
            age: playerEntry.player.age,
            phone: playerEntry.player.phone,
            experience: playerEntry.player.experience,
            battingStyle: playerEntry.player.battingStyle,
            bowlingStyle: playerEntry.player.bowlingStyle,
            isCaptain: playerEntry.isCaptain || false,
            isKeeper: playerEntry.isKeeper || false
          };
        }
        return playerEntry;
      });
    }

    // Flatten player structure for teamB
    if (matchObj.matchSquad?.teamB?.players) {
      matchObj.matchSquad.teamB.players = matchObj.matchSquad.teamB.players.map(playerEntry => {
        if (playerEntry.player && typeof playerEntry.player === 'object') {
          return {
            _id: playerEntry.player._id,
            name: playerEntry.player.name,
            email: playerEntry.player.email,
            role: playerEntry.player.role,
            gender: playerEntry.player.gender,
            city: playerEntry.player.city,
            age: playerEntry.player.age,
            phone: playerEntry.player.phone,
            experience: playerEntry.player.experience,
            battingStyle: playerEntry.player.battingStyle,
            bowlingStyle: playerEntry.player.bowlingStyle,
            isCaptain: playerEntry.isCaptain || false,
            isKeeper: playerEntry.isKeeper || false
          };
        }
        return playerEntry;
      });
    }

    return Response.json(matchObj);
  } catch (error) {
    console.error('Error fetching match:', error);
    return Response.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
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
    const existingMatch = await Match.findOne({
      _id: id,
      user: user.id,
    });
    if (!existingMatch) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const updateData = {
      matchNumber: data.matchNumber,
      teams: data.teams || {},
      venue: data.venue || {},
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      status: data.status,
      matchType: data.matchType,
      notes: data.notes
    };

    const match = await Match.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return Response.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Find match and check ownership
    const existingMatch = await Match.findOne({
      _id: id,
      user: user.id,
    });
    if (!existingMatch) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    await Match.findByIdAndDelete(id);

    return Response.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return Response.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}