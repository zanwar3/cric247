import dbConnect from "@/lib/mongodb";
import { Match } from "@/lib/models";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

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

    // At least one field must be provided
    if (!data.striker && !data.nonStriker && !data.bowler) {
      return Response.json({ 
        error: 'At least one of striker, nonStriker, or bowler must be provided' 
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

    const updatedFields = [];

    // Check if we're swapping striker and non-striker
    const isSwapping = data.striker && data.nonStriker &&
                       innings.currentStriker && innings.currentNonStriker &&
                       data.striker === innings.currentNonStriker.toString() &&
                       data.nonStriker === innings.currentStriker.toString();

    // Handle striker change
    if (data.striker) {
      // Validate: striker cannot be the same as non-striker (unless we're swapping)
      if (!isSwapping && innings.currentNonStriker && 
          innings.currentNonStriker.toString() === data.striker) {
        return Response.json({ 
          error: 'Striker cannot be the same as non-striker' 
        }, { status: 400 });
      }

      // Validate: striker cannot be the same as current striker
      if (innings.currentStriker && 
          innings.currentStriker.toString() === data.striker) {
        return Response.json({ 
          error: 'New striker cannot be the same as current striker' 
        }, { status: 400 });
      }

      innings.currentStriker = data.striker;

      // Initialize batting entry if it doesn't exist
      if (!innings.batting.find(b => b.player.toString() === data.striker)) {
        innings.batting.push({
          player: data.striker,
          battingOrder: innings.batting.length + 1,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false
        });
      }

      updatedFields.push('striker');
    }

    // Handle non-striker change
    if (data.nonStriker) {
      // Validate: non-striker cannot be the same as striker (unless we're swapping)
      if (!isSwapping && innings.currentStriker && 
          innings.currentStriker.toString() === data.nonStriker) {
        return Response.json({ 
          error: 'Non-striker cannot be the same as striker' 
        }, { status: 400 });
      }

      // Validate: non-striker cannot be the same as current non-striker
      if (innings.currentNonStriker && 
          innings.currentNonStriker.toString() === data.nonStriker) {
        return Response.json({ 
          error: 'New non-striker cannot be the same as current non-striker' 
        }, { status: 400 });
      }

      innings.currentNonStriker = data.nonStriker;

      // Initialize batting entry if it doesn't exist
      if (!innings.batting.find(b => b.player.toString() === data.nonStriker)) {
        innings.batting.push({
          player: data.nonStriker,
          battingOrder: innings.batting.length + 1,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false
        });
      }

      updatedFields.push('nonStriker');
    }

    // Handle bowler change
    if (data.bowler) {
      // Validate: same bowler cannot bowl consecutive overs
      if (innings.currentBowler && 
          innings.currentBowler.toString() === data.bowler) {
        return Response.json({ 
          error: 'Same bowler cannot bowl consecutive overs' 
        }, { status: 400 });
      }

      innings.currentBowler = data.bowler;

      let bowlerStats = innings.bowling.find(b => b.player.toString() === data.bowler);
      if (!bowlerStats) {
        bowlerStats = {
          player: data.bowler,
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

      updatedFields.push('bowler');
    }

    // Handle partnership logic if any batsman changed
    if (data.striker || data.nonStriker) {
      const finalStriker = data.striker || innings.currentStriker;
      const finalNonStriker = data.nonStriker || innings.currentNonStriker;

      if (finalStriker && finalNonStriker) {
        const shouldStartNewPartnership = () => {
          if (innings.partnerships.length === 0) return true;
          const currentPartnership = innings.partnerships[innings.partnerships.length - 1];
          if (!currentPartnership) return true;

          const batsmanA = finalStriker.toString();
          const batsmanB = finalNonStriker.toString();
          const partnershipA = currentPartnership.batsman1?.toString();
          const partnershipB = currentPartnership.batsman2?.toString();

          const matchesExisting =
            (partnershipA === batsmanA && partnershipB === batsmanB) ||
            (partnershipA === batsmanB && partnershipB === batsmanA);

          return !matchesExisting;
        };

        if (shouldStartNewPartnership()) {
          innings.partnerships.push({
            batsman1: finalStriker,
            batsman2: finalNonStriker,
            runs: 0,
            balls: 0
          });
        }
      }
    }

    await match.save();

    // Populate the updated fields for response
    const populatePaths = [];
    if (data.striker || data.nonStriker) {
      populatePaths.push('innings.currentStriker', 'innings.currentNonStriker');
    }
    if (data.bowler) {
      populatePaths.push('innings.currentBowler');
    }
    
    if (populatePaths.length > 0) {
      await match.populate(populatePaths);
    }

    const currentInningsData = match.innings[currentInningsIndex];
    const response = {
      success: true,
      message: `Updated: ${updatedFields.join(', ')}`,
      updatedFields
    };

    if (data.striker) {
      response.striker = currentInningsData.currentStriker;
    }
    if (data.nonStriker) {
      response.nonStriker = currentInningsData.currentNonStriker;
    }
    if (data.bowler) {
      response.bowler = currentInningsData.currentBowler;
    }

    return Response.json(response);

  } catch (error) {
    console.error('Error updating players:', error);
    return Response.json({ 
      error: 'Failed to update players',
      details: error.message 
    }, { status: 500 });
  }
}

