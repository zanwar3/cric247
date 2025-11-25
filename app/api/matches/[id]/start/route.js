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

    // Find match and check ownership
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    }).populate('teams.teamA teams.teamB');

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Validate match is ready to start
    if (!match.tossWinner || !match.tossDecision) {
      return Response.json({ 
        error: 'Match setup incomplete. Please complete toss and squad selection first.' 
      }, { status: 400 });
    }

    if (match.status === "Live") {
      return Response.json({ 
        error: 'Match is already live' 
      }, { status: 400 });
    }

    // Determine batting and bowling teams based on toss
    let battingTeam, bowlingTeam;
    
    if (match.tossDecision === "Bat") {
      battingTeam = match.tossWinner;
      bowlingTeam = match.tossWinner.toString() === match.teams.teamA.toString() 
        ? match.teams.teamB 
        : match.teams.teamA;
    } else {
      bowlingTeam = match.tossWinner;
      battingTeam = match.tossWinner.toString() === match.teams.teamA.toString() 
        ? match.teams.teamB 
        : match.teams.teamA;
    }

    // Initialize first innings
    const firstInnings = {
      inningNumber: 1,
      battingTeam: battingTeam,
      bowlingTeam: bowlingTeam,
      totalRuns: 0,
      totalWickets: 0,
      totalOvers: 0,
      totalBalls: 0,
      runRate: 0,
      requiredRunRate: 0,
      extras: {
        byes: 0,
        legByes: 0,
        wides: 0,
        noBalls: 0,
        penalties: 0
      },
      batting: [],
      bowling: [],
      partnerships: [],
      fallOfWickets: [],
      balls: [],
      isCompleted: false
    };

    match.innings = [firstInnings];
    match.currentInnings = 1;
    match.status = "Live";
    match.actualStartTime = new Date();

    await match.save();

    // Populate the match for response
    await match.populate([
      'teams.teamA',
      'teams.teamB',
      'innings.battingTeam',
      'innings.bowlingTeam'
    ]);

    const battingTeamObj = match.teams.teamA._id.toString() === battingTeam.toString() 
      ? match.teams.teamA 
      : match.teams.teamB;
    
    const bowlingTeamObj = match.teams.teamA._id.toString() === bowlingTeam.toString() 
      ? match.teams.teamA 
      : match.teams.teamB;

    return Response.json({ 
      success: true,
      message: 'Match started successfully. Please set opening batsmen and bowler.',
      match: {
        _id: match._id,
        status: match.status,
        currentInnings: match.currentInnings
      },
      innings: {
        inningNumber: firstInnings.inningNumber,
        battingTeam: battingTeamObj,
        bowlingTeam: bowlingTeamObj,
        totalRuns: firstInnings.totalRuns,
        totalWickets: firstInnings.totalWickets,
        totalBalls: firstInnings.totalBalls
      },
      needsPlayers: true
    });

  } catch (error) {
    console.error('Error starting match:', error);
    return Response.json({ 
      error: 'Failed to start match',
      details: error.message 
    }, { status: 500 });
  }
}

