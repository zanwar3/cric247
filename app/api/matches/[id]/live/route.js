import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Ball from "@/models/Ball";
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
    .populate('innings.currentStriker innings.currentNonStriker innings.currentBowler')
    .populate('innings.batting.player')
    .populate('innings.bowling.player')
    .populate('innings.partnerships.batsman1 innings.partnerships.batsman2')
    .populate('innings.fallOfWickets.player');

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get current innings
    const currentInningsIndex = match.currentInnings - 1;
    const innings = match.innings[currentInningsIndex];

    if (!innings) {
      return Response.json({ 
        error: 'No active innings found',
        match: {
          matchId: match._id,
          status: match.status,
          matchType: match.matchType,
          oversLimit: match.oversLimit,
          currentInnings: match.currentInnings,
          teams: {
            teamA: match.teams.teamA,
            teamB: match.teams.teamB
          }
        }
      }, { status: 200 });
    }

    // Get latest balls for current over
    const currentOver = Math.floor(innings.totalBalls / 6) + 1;
    const ballsInCurrentOver = await Ball.find({
      match_id: id,
      user: user.id,
      innings_id: innings.inningNumber.toString(),
      over: currentOver
    }).sort({ createdAt: 1 }).limit(6);

    // Format current over balls
    const currentOverBalls = ballsInCurrentOver.map(ball => {
      if (ball.wicket?.isWicket) return 'W';

      const extras = ball.extras || {};
      const normalizeExtra = (value) => {
        if (typeof value === "number" && !Number.isNaN(value)) return value;
        if (typeof value === "boolean") return value ? 1 : 0;
        if (typeof value === "string" && value.trim() !== "") {
          const parsed = Number(value);
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      const wideRuns = normalizeExtra(extras.wide);
      if (wideRuns > 0) return `${wideRuns}wd`;

      const noBallRuns = normalizeExtra(extras.noBall);
      if (noBallRuns > 0) {
        const batContribution = ball.runs && ball.runs > 0 ? ball.runs : noBallRuns;
        return `${batContribution}nb`;
      }

      const byeRuns = normalizeExtra(extras.bye);
      if (byeRuns > 0) return `${byeRuns}b`;

      const legByeRuns = normalizeExtra(extras.legBye);
      if (legByeRuns > 0) return `${legByeRuns}lb`;

      return (ball.runs ?? 0).toString();
    });


    // Get striker and non-striker stats
    const strikerStats = innings.batting.find(b => 
      innings.currentStriker && b.player && b.player._id && 
      b.player._id.toString() === innings.currentStriker._id.toString()
    );
    
    const nonStrikerStats = innings.batting.find(b => 
      innings.currentNonStriker && b.player && b.player._id && 
      b.player._id.toString() === innings.currentNonStriker._id.toString()
    );

    // Get current bowler stats
    const bowlerStats = innings.bowling.find(b => 
      innings.currentBowler && b.player && b.player._id && 
      b.player._id.toString() === innings.currentBowler._id.toString()
    );

    // Calculate total extras
    const totalExtras = 
      innings.extras.byes + 
      innings.extras.legByes + 
      innings.extras.wides + 
      innings.extras.noBalls + 
      innings.extras.penalties;

    // Format overs (e.g., 15.2)
    const completedOvers = Math.floor(innings.totalBalls / 6);
    const ballsInOver = innings.totalBalls % 6;
    const oversDisplay = `${completedOvers}.${ballsInOver}`;

    // Calculate "to win" message for 2nd innings
    let toWinMessage = null;
    if (innings.inningNumber === 2 && innings.target) {
      const runsNeeded = innings.target - innings.totalRuns;
      const ballsRemaining = (match.oversLimit * 6) - innings.totalBalls;
      
      if (runsNeeded > 0) {
        toWinMessage = `${runsNeeded} runs needed from ${ballsRemaining} balls`;
      } else {
        toWinMessage = `Target achieved`;
      }
    }

    // Build comprehensive response
    const liveData = {
      match: {
        matchId: match._id,
        status: match.status,
        matchType: match.matchType,
        oversLimit: match.oversLimit,
        playersPerTeam: match.playersPerTeam,
        currentInnings: match.currentInnings,
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
        venue: match.venue,
        tossWinner: match.tossWinner,
        tossDecision: match.tossDecision
      },
      innings: {
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
          totalBalls: innings.totalBalls,
          runRate: parseFloat(innings.runRate) || 0,
          requiredRunRate: innings.inningNumber === 2 ? parseFloat(innings.requiredRunRate) || 0 : null
        },
        currentBatsmen: {
          striker: strikerStats ? {
            _id: strikerStats.player._id,
            name: strikerStats.player.name,
            runs: strikerStats.runs,
            balls: strikerStats.ballsFaced,
            fours: strikerStats.fours,
            sixes: strikerStats.sixes,
            strikeRate: parseFloat(strikerStats.strikeRate) || 0
          } : null,
          nonStriker: nonStrikerStats ? {
            _id: nonStrikerStats.player._id,
            name: nonStrikerStats.player.name,
            runs: nonStrikerStats.runs,
            balls: nonStrikerStats.ballsFaced,
            fours: nonStrikerStats.fours,
            sixes: nonStrikerStats.sixes,
            strikeRate: parseFloat(nonStrikerStats.strikeRate) || 0
          } : null
        },
        currentBowler: bowlerStats ? {
          _id: bowlerStats.player._id,
          name: bowlerStats.player.name,
          overs: bowlerStats.overs,
          maidens: bowlerStats.maidens,
          runs: bowlerStats.runs,
          wickets: bowlerStats.wickets,
          economy: parseFloat(bowlerStats.economy) || 0
        } : null,
        currentOver: {
          overNumber: currentOver,
          balls: currentOverBalls
        },
        partnerships: innings.partnerships.map(p => ({
          batsman1: p.batsman1 ? {
            _id: p.batsman1._id,
            name: p.batsman1.name
          } : null,
          batsman2: p.batsman2 ? {
            _id: p.batsman2._id,
            name: p.batsman2.name
          } : null,
          runs: p.runs,
          balls: p.balls
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
      },
      scorecard: {
        batting: innings.batting
          .filter(b => b.player && b.player._id) // Filter out null/undefined players
          .map(b => ({
            player: {
              _id: b.player._id,
              name: b.player.name
            },
            battingOrder: b.battingOrder,
            runs: b.runs,
            balls: b.ballsFaced,
            fours: b.fours,
            sixes: b.sixes,
            strikeRate: parseFloat(b.strikeRate) || 0,
            isOut: b.isOut,
            dismissalType: b.dismissalType || null
          })),
        bowling: innings.bowling
          .filter(b => b.player && b.player._id) // Filter out null/undefined players
          .map(b => ({
            player: {
              _id: b.player._id,
              name: b.player.name
            },
            overs: b.overs,
            maidens: b.maidens,
            runs: b.runs,
            wickets: b.wickets,
            wides: b.wides,
            noBalls: b.noBalls,
            economy: parseFloat(b.economy) || 0
          }))
      },
      target: innings.target || null,
      toWin: toWinMessage
    };

    return Response.json(liveData);

  } catch (error) {
    console.error('Error fetching live match data:', error);
    return Response.json({ 
      error: 'Failed to fetch live match data',
      details: error.message 
    }, { status: 500 });
  }
}

