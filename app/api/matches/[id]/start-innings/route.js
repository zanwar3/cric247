import dbConnect from "@/lib/mongodb";
import { Match } from "@/lib/models";
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

    // Validate required fields
    if (!data.striker || !data.nonStriker || !data.bowler) {
      return Response.json({ 
        error: 'Striker, non-striker, and bowler are required' 
      }, { status: 400 });
    }

    // Find match and check ownership
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    }).populate('teams.teamA teams.teamB');

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const allowedStatuses = ["Live", "Innings Break"];
    if (!allowedStatuses.includes(match.status)) {
      return Response.json({ 
        error: 'Match must be Live or Innings Break to set innings players' 
      }, { status: 400 });
    }

    if (!match.innings || match.innings.length === 0) {
      return Response.json({ 
        error: 'No innings found. Please start the match first.' 
      }, { status: 400 });
    }

    // Get current innings
    const currentInningsIndex = match.currentInnings - 1;
    const currentInnings = match.innings[currentInningsIndex];

    if (!currentInnings) {
      return Response.json({ 
        error: 'Current innings not found' 
      }, { status: 404 });
    }

    // Validate striker and non-striker are different
    if (data.striker === data.nonStriker) {
      return Response.json({ 
        error: 'Striker and non-striker must be different players' 
      }, { status: 400 });
    }

    // Set current players
    currentInnings.currentStriker = data.striker;
    currentInnings.currentNonStriker = data.nonStriker;
    currentInnings.currentBowler = data.bowler;

    // Initialize batting entries if they don't exist
    if (!currentInnings.batting.find(b => b.player.toString() === data.striker)) {
      currentInnings.batting.push({
        player: data.striker,
        battingOrder: currentInnings.batting.length + 1,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false
      });
    }

    if (!currentInnings.batting.find(b => b.player.toString() === data.nonStriker)) {
      currentInnings.batting.push({
        player: data.nonStriker,
        battingOrder: currentInnings.batting.length + 1,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false
      });
    }

    // Initialize bowling entry if it doesn't exist
    if (!currentInnings.bowling.find(b => b.player.toString() === data.bowler)) {
      currentInnings.bowling.push({
        player: data.bowler,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: 0
      });
    }

    // Initialize partnership if this is the first one
    if (currentInnings.partnerships.length === 0) {
      currentInnings.partnerships.push({
        batsman1: data.striker,
        batsman2: data.nonStriker,
        runs: 0,
        balls: 0
      });
    }

    // Initialize over and ball count if not set
    if (currentInnings.totalOvers === undefined) {
      currentInnings.totalOvers = 0;
    }
    if (currentInnings.totalBalls === undefined) {
      currentInnings.totalBalls = 0;
    }

    // When starting second innings (was Innings Break), set status back to Live
    if (match.status === "Innings Break") {
      match.status = "Live";
    }

    await match.save();

    // Populate for response
    await match.populate([
      'innings.currentStriker',
      'innings.currentNonStriker',
      'innings.currentBowler'
    ]);

    const currentInningsData = match.innings[currentInningsIndex];

    return Response.json({ 
      success: true,
      message: 'Innings players set successfully. Ready to start scoring.',
      currentInnings: {
        inningNumber: currentInningsData.inningNumber,
        currentStriker: currentInningsData.currentStriker,
        currentNonStriker: currentInningsData.currentNonStriker,
        currentBowler: currentInningsData.currentBowler
      }
    });

  } catch (error) {
    console.error('Error starting innings:', error);
    return Response.json({ 
      error: 'Failed to start innings',
      details: error.message 
    }, { status: 500 });
  }
}

