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

    if (!data.newBatsman || !data.position) {
      return Response.json({ 
        error: 'New batsman and position (striker/nonStriker) are required' 
      }, { status: 400 });
    }

    if (data.position !== 'striker' && data.position !== 'nonStriker') {
      return Response.json({ 
        error: 'Position must be either "striker" or "nonStriker"' 
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

    // Validate: new batsman cannot be the same as the other batsman
    if (data.position === 'striker' && innings.currentNonStriker && 
        innings.currentNonStriker.toString() === data.newBatsman) {
      return Response.json({ 
        error: 'New batsman cannot be the same as non-striker' 
      }, { status: 400 });
    }

    if (data.position === 'nonStriker' && innings.currentStriker && 
        innings.currentStriker.toString() === data.newBatsman) {
      return Response.json({ 
        error: 'New batsman cannot be the same as striker' 
      }, { status: 400 });
    }

    const otherBatsman = data.position === 'striker' 
      ? innings.currentNonStriker 
      : innings.currentStriker;

    const shouldStartNewPartnership = () => {
      if (!otherBatsman) return false;
      if (innings.partnerships.length === 0) return true;
      const currentPartnership = innings.partnerships[innings.partnerships.length - 1];
      if (!currentPartnership) return true;

      const batsmanA = data.newBatsman.toString();
      const batsmanB = otherBatsman.toString();
      const partnershipA = currentPartnership.batsman1?.toString();
      const partnershipB = currentPartnership.batsman2?.toString();

      const matchesExisting =
        (partnershipA === batsmanA && partnershipB === batsmanB) ||
        (partnershipA === batsmanB && partnershipB === batsmanA);

      return !matchesExisting;
    };

    // Set new batsman
    if (data.position === 'striker') {
      innings.currentStriker = data.newBatsman;
    } else {
      innings.currentNonStriker = data.newBatsman;
    }

    // Initialize batting entry if it doesn't exist
    if (!innings.batting.find(b => b.player.toString() === data.newBatsman)) {
      innings.batting.push({
        player: data.newBatsman,
        battingOrder: innings.batting.length + 1,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false
      });
    }

    if (shouldStartNewPartnership()) {
      innings.partnerships.push({
        batsman1: data.position === 'striker' ? data.newBatsman : otherBatsman,
        batsman2: data.position === 'striker' ? otherBatsman : data.newBatsman,
        runs: 0,
        balls: 0
      });
    }

    await match.save();

    // Populate the new batsman for response
    await match.populate([
      'innings.currentStriker',
      'innings.currentNonStriker'
    ]);

    const currentInningsData = match.innings[currentInningsIndex];
    const newBatsmanObj = data.position === 'striker' 
      ? currentInningsData.currentStriker 
      : currentInningsData.currentNonStriker;

    return Response.json({ 
      success: true,
      message: `${data.position === 'striker' ? 'Striker' : 'Non-striker'} changed successfully`,
      newBatsman: newBatsmanObj,
      position: data.position
    });

  } catch (error) {
    console.error('Error changing batsman:', error);
    return Response.json({ 
      error: 'Failed to change batsman',
      details: error.message 
    }, { status: 500 });
  }
}

