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

    if (match.status !== "Live") {
      return Response.json({ 
        error: 'Match must be live to end innings' 
      }, { status: 400 });
    }

    // Get current innings
    const currentInningsIndex = match.currentInnings - 1;
    const innings = match.innings[currentInningsIndex];

    if (!innings) {
      return Response.json({ 
        error: 'No active innings found' 
      }, { status: 404 });
    }

    if (innings.isCompleted) {
      return Response.json({ 
        error: 'Innings is already completed' 
      }, { status: 400 });
    }

    // Mark innings as completed
    innings.isCompleted = true;

    // Calculate final overs
    innings.totalOvers = Math.floor(innings.totalBalls / 6) + (innings.totalBalls % 6) / 10;

    const inningsSummary = {
      inningNumber: innings.inningNumber,
      battingTeam: innings.battingTeam,
      bowlingTeam: innings.bowlingTeam,
      totalRuns: innings.totalRuns,
      totalWickets: innings.totalWickets,
      totalOvers: innings.totalOvers,
      runRate: innings.runRate,
      extras: innings.extras,
      batting: innings.batting,
      bowling: innings.bowling,
      fallOfWickets: innings.fallOfWickets
    };

    if (innings.inningNumber === 1) {
      const target = innings.totalRuns + 1;

      const secondInnings = {
        inningNumber: 2,
        battingTeam: innings.bowlingTeam,
        bowlingTeam: innings.battingTeam,
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        totalBalls: 0,
        runRate: 0,
        requiredRunRate: 0,
        target,
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

      match.innings.push(secondInnings);
      match.currentInnings = 2;
      match.status = "Innings Break";

      await match.save();

      // Populate teams for response
      await match.populate([
        'teams.teamA',
        'teams.teamB',
        'innings.battingTeam',
        'innings.bowlingTeam'
      ]);

      return Response.json({
        success: true,
        message: 'First innings completed. Second innings ready to start.',
        inningsSummary: {
          inningNumber: inningsSummary.inningNumber,
          battingTeam: innings.battingTeam,
          bowlingTeam: innings.bowlingTeam,
          totalRuns: inningsSummary.totalRuns,
          totalWickets: inningsSummary.totalWickets,
          totalOvers: inningsSummary.totalOvers
        },
        target,
        nextInnings: 2,
        needsPlayers: true,
        matchStatus: match.status
      });
    }

    if (innings.inningNumber === 2) {
      const firstInnings = match.innings[0];
      const target = firstInnings.totalRuns + 1;

      let winner = null;
      let winBy = null;
      let margin = 0;

      if (innings.totalRuns >= target) {
        winner = innings.battingTeam;
        winBy = "wickets";
        margin = Math.max(match.playersPerTeam - innings.totalWickets, 0);
      } else if (innings.totalRuns === firstInnings.totalRuns) {
        winBy = "tie";
        margin = 0;
        winner = null;
      } else {
        winner = innings.bowlingTeam;
        winBy = "runs";
        margin = firstInnings.totalRuns - innings.totalRuns;
      }

      match.result = {
        winner,
        winBy,
        margin,
        manOfTheMatch: match.result?.manOfTheMatch || null
      };

      match.status = "Result Pending";
      match.actualEndTime = new Date();

      await match.save();

      // Populate teams for response
      await match.populate([
        'teams.teamA',
        'teams.teamB',
        'innings.battingTeam',
        'innings.bowlingTeam'
      ]);

      const winnerTeam = winner
        ? (winner.toString() === match.teams.teamA._id.toString()
          ? match.teams.teamA
          : match.teams.teamB)
        : null;

      return Response.json({
        success: true,
        message: 'Second innings completed. Finalize match to lock result.',
        inningsSummary: {
          inningNumber: inningsSummary.inningNumber,
          battingTeam: innings.battingTeam,
          bowlingTeam: innings.bowlingTeam,
          totalRuns: inningsSummary.totalRuns,
          totalWickets: inningsSummary.totalWickets,
          totalOvers: inningsSummary.totalOvers
        },
        result: {
          winner: winnerTeam,
          winBy,
          margin,
          status: match.status,
          winnerName: winnerTeam ? winnerTeam.name : null
        }
      });
    }

    await match.save();

    return Response.json({ 
      success: true,
      message: 'Innings ended',
      inningsSummary
    });

  } catch (error) {
    console.error('Error ending innings:', error);
    return Response.json({ 
      error: 'Failed to end innings',
      details: error.message 
    }, { status: 500 });
  }
}

