import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;
    const data = await request.json();

    if (!data.newBowler) {
      return Response.json({ 
        error: 'New bowler is required' 
      }, { status: 400 });
    }

    // Find match and check ownership
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    });

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get current innings
    const currentInningsIndex = match.currentInnings - 1;
    const innings = match.innings[currentInningsIndex];

    if (!innings) {
      return Response.json({ 
        error: 'No active innings found' 
      }, { status: 400 });
    }

    // Validate: same bowler cannot bowl consecutive overs
    if (innings.currentBowler && innings.currentBowler.toString() === data.newBowler) {
      return Response.json({ 
        error: 'Same bowler cannot bowl consecutive overs' 
      }, { status: 400 });
    }

    innings.currentBowler = data.newBowler;

    let bowlerStats = innings.bowling.find(b => b.player.toString() === data.newBowler);
    if (!bowlerStats) {
      bowlerStats = {
        player: data.newBowler,
        ballsBowled: 0,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: 0,
        currentOverRuns: 0
      };
      innings.bowling.push(bowlerStats);
    } else {
      bowlerStats.currentOverRuns = 0;
    }

    await match.save();

    return Response.json({ 
      success: true,
      message: 'Bowler changed successfully',
      newBowler: data.newBowler
    });

  } catch (error) {
    console.error('Error changing bowler:', error);
    return Response.json({ 
      error: 'Failed to change bowler',
      details: error.message 
    }, { status: 500 });
  }
}

