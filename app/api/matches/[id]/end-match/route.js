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
    }).populate('teams.teamA teams.teamB');

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    const alreadyCompleted = match.status === "Completed";

    const firstInnings = match.innings[0];
    const secondInnings = match.innings[1];

    if (!firstInnings) {
      return Response.json({
        error: 'Match must have at least one innings to complete'
      }, { status: 400 });
    }

    let winner = null;
    let winBy = "no result";
    let margin = 0;

    if (secondInnings) {
      const target = firstInnings.totalRuns + 1;

      if (secondInnings.totalRuns >= target) {
        winner = secondInnings.battingTeam;
        winBy = "wickets";
        margin = Math.max(match.playersPerTeam - secondInnings.totalWickets, 0);
      } else if (secondInnings.totalRuns === firstInnings.totalRuns) {
        winBy = "tie";
        margin = 0;
        winner = null;
      } else {
        winner = secondInnings.bowlingTeam;
        winBy = "runs";
        margin = firstInnings.totalRuns - secondInnings.totalRuns;
      }
    }

    match.result = {
      winner,
      winBy,
      margin,
      manOfTheMatch: data.manOfTheMatch || match.result?.manOfTheMatch || null
    };

    match.status = "Completed";
    if (!match.actualEndTime) {
      match.actualEndTime = new Date();
    }

    // Mark all innings as completed
    match.innings.forEach(innings => {
      innings.isCompleted = true;
    });

    await match.save();

    // Populate winner and manOfTheMatch for response
    await match.populate([
      'teams.teamA',
      'teams.teamB',
      'result.winner',
      'result.manOfTheMatch'
    ]);

    // Update team statistics
    if (!alreadyCompleted && winner) {
      try {
        await Team.findByIdAndUpdate(winner, {
          $inc: {
            'statistics.matchesPlayed': 1,
            'statistics.matchesWon': 1
          }
        });

        const loser = winner.toString() === match.teams.teamA._id.toString() 
          ? match.teams.teamB._id 
          : match.teams.teamA._id;
        
        await Team.findByIdAndUpdate(loser, {
          $inc: {
            'statistics.matchesPlayed': 1,
            'statistics.matchesLost': 1
          }
        });
      } catch (teamError) {
        console.error('Error updating team statistics:', teamError);
        // Continue even if team stats update fails
      }
    } else if (!alreadyCompleted && winBy === "tie") {
      try {
        await Team.findByIdAndUpdate(match.teams.teamA._id, {
          $inc: {
            'statistics.matchesPlayed': 1,
            'statistics.matchesDrawn': 1
          }
        });
        
        await Team.findByIdAndUpdate(match.teams.teamB._id, {
          $inc: {
            'statistics.matchesPlayed': 1,
            'statistics.matchesDrawn': 1
          }
        });
      } catch (teamError) {
        console.error('Error updating team statistics:', teamError);
      }
    }

    // Prepare result message
    let resultMessage;
    const winnerTeam = match.result.winner;
    
    if (winBy === "runs" && winnerTeam) {
      resultMessage = `${winnerTeam.name} won by ${margin} runs`;
    } else if (winBy === "wickets" && winnerTeam) {
      resultMessage = `${winnerTeam.name} won by ${margin} wickets`;
    } else if (winBy === "tie") {
      resultMessage = "Match tied";
    } else {
      resultMessage = "No result";
    }

    return Response.json({ 
      success: true,
      message: 'Match completed successfully',
      result: {
        winner: winnerTeam,
        winBy: winBy,
        margin: margin,
        manOfTheMatch: match.result.manOfTheMatch,
        resultMessage: resultMessage
      },
      match: {
        _id: match._id,
        status: match.status,
        actualEndTime: match.actualEndTime
      }
    });

  } catch (error) {
    console.error('Error ending match:', error);
    return Response.json({ 
      error: 'Failed to end match',
      details: error.message 
    }, { status: 500 });
  }
}

