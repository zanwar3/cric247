import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

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
    .populate('teams.teamA teams.teamB')
    .populate('innings.battingTeam innings.bowlingTeam')
    .populate('innings.batting.player')
    .populate('innings.bowling.player')
    .populate('innings.fallOfWickets.player')
    .populate('result.winner result.manOfTheMatch');

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Build scorecard for all innings
    const scorecardData = {
      match: {
        matchId: match._id,
        status: match.status,
        matchType: match.matchType,
        oversLimit: match.oversLimit,
        venue: match.venue,
        scheduledDate: match.scheduledDate,
        actualStartTime: match.actualStartTime,
        actualEndTime: match.actualEndTime,
        teams: {
          teamA: {
            _id: match.teams.teamA._id,
            name: match.teams.teamA.name,
            slug: match.teams.teamA.slug
          },
          teamB: {
            _id: match.teams.teamB._id,
            name: match.teams.teamB.name,
            slug: match.teams.teamB.slug
          }
        },
        tossWinner: match.tossWinner,
        tossDecision: match.tossDecision
      },
      innings: match.innings.map(innings => {
        const completedOvers = Math.floor(innings.totalBalls / 6);
        const ballsInOver = innings.totalBalls % 6;
        const oversDisplay = `${completedOvers}.${ballsInOver}`;

        const totalExtras = 
          innings.extras.byes + 
          innings.extras.legByes + 
          innings.extras.wides + 
          innings.extras.noBalls + 
          innings.extras.penalties;

        return {
          inningNumber: innings.inningNumber,
          battingTeam: {
            _id: innings.battingTeam._id,
            name: innings.battingTeam.name,
            slug: innings.battingTeam.slug
          },
          bowlingTeam: {
            _id: innings.bowlingTeam._id,
            name: innings.bowlingTeam.name,
            slug: innings.bowlingTeam.slug
          },
          score: {
            runs: innings.totalRuns,
            wickets: innings.totalWickets,
            overs: oversDisplay,
            runRate: parseFloat(innings.runRate) || 0
          },
          target: innings.target || null,
          isCompleted: innings.isCompleted,
          batting: innings.batting.map(b => ({
            player: {
              _id: b.player._id,
              name: b.player.name,
              role: b.player.role
            },
            battingOrder: b.battingOrder,
            runs: b.runs,
            balls: b.ballsFaced,
            fours: b.fours,
            sixes: b.sixes,
            strikeRate: parseFloat(b.strikeRate) || 0,
            isOut: b.isOut,
            dismissalType: b.dismissalType || 'Not Out'
          })).sort((a, b) => a.battingOrder - b.battingOrder),
          bowling: innings.bowling.map(b => ({
            player: {
              _id: b.player._id,
              name: b.player.name,
              role: b.player.role
            },
            overs: b.overs,
            maidens: b.maidens,
            runs: b.runs,
            wickets: b.wickets,
            wides: b.wides,
            noBalls: b.noBalls,
            economy: parseFloat(b.economy) || 0
          })),
          fallOfWickets: innings.fallOfWickets.map(fow => ({
            score: `${fow.runs}-${fow.wickets}`,
            player: fow.player ? {
              _id: fow.player._id,
              name: fow.player.name
            } : null,
            over: fow.over
          })),
          extras: {
            byes: innings.extras.byes,
            legByes: innings.extras.legByes,
            wides: innings.extras.wides,
            noBalls: innings.extras.noBalls,
            penalties: innings.extras.penalties,
            total: totalExtras
          }
        };
      }),
      result: match.result && match.result.winner ? {
        winner: {
          _id: match.result.winner._id,
          name: match.result.winner.name
        },
        winBy: match.result.winBy,
        margin: match.result.margin,
        manOfTheMatch: match.result.manOfTheMatch ? {
          _id: match.result.manOfTheMatch._id,
          name: match.result.manOfTheMatch.name
        } : null
      } : null
    };

    return Response.json(scorecardData);

  } catch (error) {
    console.error('Error fetching scorecard:', error);
    return Response.json({ 
      error: 'Failed to fetch scorecard',
      details: error.message 
    }, { status: 500 });
  }
}

