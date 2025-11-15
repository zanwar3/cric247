import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Team from "@/models/Team";
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
        error: 'Team IDs for both teams are required in matchSquad' 
      }, { status: 400 });
    }

    // Fetch teams with their players
    const teamA = await Team.findOne({
      _id: data.matchSquad.teamA,
      user: user.id
    }).populate('players.player');

    const teamB = await Team.findOne({
      _id: data.matchSquad.teamB,
      user: user.id
    }).populate('players.player');

    if (!teamA) {
      return Response.json({ 
        error: 'Team A not found' 
      }, { status: 404 });
    }

    if (!teamB) {
      return Response.json({ 
        error: 'Team B not found' 
      }, { status: 404 });
    }

    // Get active players from teams
    const teamAActivePlayers = teamA.players.filter(p => p.isActive);
    const teamBActivePlayers = teamB.players.filter(p => p.isActive);

    if (teamAActivePlayers.length === 0) {
      return Response.json({ 
        error: 'Team A must have at least one active player' 
      }, { status: 400 });
    }

    if (teamBActivePlayers.length === 0) {
      return Response.json({ 
        error: 'Team B must have at least one active player' 
      }, { status: 400 });
    }

    // Build player arrays with captain and keeper flags
    const teamAPlayers = teamAActivePlayers.map((p, index) => ({
      player: p.player._id,
      isCaptain: index === 0, // First player as captain by default
      isKeeper: p.player.role === 'Wicket-keeper'
    }));

    const teamBPlayers = teamBActivePlayers.map((p, index) => ({
      player: p.player._id,
      isCaptain: index === 0, // First player as captain by default
      isKeeper: p.player.role === 'Wicket-keeper'
    }));

    // Find captain and keeper for each team
    const teamACaptain = teamAPlayers.find(p => p.isCaptain);
    const teamAKeeper = teamAPlayers.find(p => p.isKeeper);
    const teamBCaptain = teamBPlayers.find(p => p.isCaptain);
    const teamBKeeper = teamBPlayers.find(p => p.isKeeper);

    if (!teamACaptain) {
      return Response.json({ 
        error: 'Team A must have a captain' 
      }, { status: 400 });
    }

    if (!teamAKeeper) {
      return Response.json({ 
        error: 'Team A must have a wicket keeper' 
      }, { status: 400 });
    }

    if (!teamBCaptain) {
      return Response.json({ 
        error: 'Team B must have a captain' 
      }, { status: 400 });
    }

    if (!teamBKeeper) {
      return Response.json({ 
        error: 'Team B must have a wicket keeper' 
      }, { status: 400 });
    }

    // Update match with setup data
    match.tossWinner = data.tossWinner;
    match.tossDecision = data.tossDecision;
    match.playersPerTeam = Math.min(teamAPlayers.length, teamBPlayers.length);
    
    // Set match squad with captain and keeper
    match.matchSquad = {
      teamA: {
        players: teamAPlayers,
        captain: teamACaptain.player,
        keeper: teamAKeeper.player
      },
      teamB: {
        players: teamBPlayers,
        captain: teamBCaptain.player,
        keeper: teamBKeeper.player
      }
    };

    // Update overs limit if provided
    if (data.oversLimit) {
      match.oversLimit = data.oversLimit;
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

    // Populate teams and players for response
    await match.populate([
      'teams.teamA',
      'teams.teamB',
      'innings.battingTeam',
      'innings.bowlingTeam',
      'matchSquad.teamA.players.player',
      'matchSquad.teamB.players.player',
      'matchSquad.teamA.captain',
      'matchSquad.teamA.keeper',
      'matchSquad.teamB.captain',
      'matchSquad.teamB.keeper'
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
    console.error('Error setting up match:', error);
    return Response.json({ 
      error: 'Failed to setup match',
      details: error.message 
    }, { status: 500 });
  }
}

