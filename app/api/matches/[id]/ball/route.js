import dbConnect from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Match from "@/models/Match";
import Team from "@/models/Team";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse } from "@/lib/auth-utils";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Check if match belongs to user
    const match = await Match.findById({
      _id: id,
      user: user.id,
    });
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get the latest ball for this match and user
    const ball = await Ball.findOne({ 
      match_id: id,
      user: user.id 
    }).sort({ createdAt: -1 });

    if (!ball) {
      return Response.json({ success: false, message: "No ball data found" });
    }

    return Response.json({ success: true, ball });
  } catch (error) {
    console.error('Error fetching ball data:', error);
    return Response.json({ error: 'Failed to fetch ball data' }, { status: 500 });
  }
}

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

    // Check if match belongs to user
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
      return Response.json({ error: 'No active innings found' }, { status: 400 });
    }

    // Validate required players are set
    if (!innings.currentStriker || !innings.currentNonStriker || !innings.currentBowler) {
      return Response.json({ 
        error: 'Striker, non-striker, and bowler must be set before recording balls' 
      }, { status: 400 });
    }

    const strikerObjectId = innings.currentStriker;
    const nonStrikerObjectId = innings.currentNonStriker;
    const bowlerObjectId = innings.currentBowler;

    const preStrikerId = strikerObjectId ? strikerObjectId.toString() : null;
    const preNonStrikerId = nonStrikerObjectId ? nonStrikerObjectId.toString() : null;
    const preBowlerId = bowlerObjectId ? bowlerObjectId.toString() : null;

    const rawRuns = Number.isFinite(Number(data.runs)) ? Number(data.runs) : 0;
    const extrasPayload = data.extras || {};

    const normalizeExtrasValue = (value, fallbackWhenTrue = 0) => {
      if (value === undefined || value === null) return 0;
      if (typeof value === "number" && !Number.isNaN(value)) return value;
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      if (typeof value === "boolean") {
        return value ? fallbackWhenTrue : 0;
      }
      return 0;
    };

    const wideRuns = normalizeExtrasValue(extrasPayload.wide, 1);
    const noBallPenalty = normalizeExtrasValue(extrasPayload.noBall, 1);

    let batRuns = rawRuns;

    let byeRuns = 0;
    if (extrasPayload.bye !== undefined && extrasPayload.bye !== null && extrasPayload.bye !== false) {
      byeRuns = typeof extrasPayload.bye === "number"
        ? extrasPayload.bye
        : rawRuns;
      batRuns = Math.max(batRuns - byeRuns, 0);
    }

    let legByeRuns = 0;
    if (extrasPayload.legBye !== undefined && extrasPayload.legBye !== null && extrasPayload.legBye !== false) {
      legByeRuns = typeof extrasPayload.legBye === "number"
        ? extrasPayload.legBye
        : rawRuns;
      batRuns = Math.max(batRuns - legByeRuns, 0);
    }

    // For wide balls, batsman doesn't get credit for runs
    // but additional runs are still counted in total runs and bowler's conceded runs
    const isWide = wideRuns > 0;
    const batRunsForBatsman = isWide ? 0 : batRuns;
    const isNoBall = noBallPenalty > 0;
    const isBye = byeRuns > 0;
    const isLegBye = legByeRuns > 0;
    const isWicket = data.wicket?.isWicket || false;

    if (isNoBall && isWicket && data.wicket?.dismissalType !== "Run Out") {
      return Response.json({
        error: 'Only run out is allowed on no-ball'
      }, { status: 400 });
    }

    const isValidBall = !isWide && !isNoBall;
    let completedOverByBowler = false;

    const totalRunsThisBall = batRuns + byeRuns + legByeRuns + wideRuns + noBallPenalty;

    innings.totalRuns += totalRunsThisBall;
    if (isValidBall) {
      innings.totalBalls += 1;
      // Check if over is complete (6 valid balls)
      if (innings.totalBalls % 6 === 0 && innings.totalBalls > 0) {
        completedOverByBowler = true;
      }
    }

    innings.extras.byes += byeRuns;
    innings.extras.legByes += legByeRuns;
    innings.extras.wides += wideRuns;
    innings.extras.noBalls += noBallPenalty;

    // Ensure striker entry exists
    let strikerStats = strikerObjectId
      ? innings.batting.find(b => b.player.toString() === strikerObjectId.toString())
      : null;

    if (strikerObjectId && !strikerStats) {
      strikerStats = {
        player: strikerObjectId,
        battingOrder: innings.batting.length + 1,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false
      };
      innings.batting.push(strikerStats);
    }

    if (strikerStats) {
      strikerStats.runs += batRunsForBatsman;
      if (batRunsForBatsman === 4) strikerStats.fours += 1;
      if (batRunsForBatsman === 6) strikerStats.sixes += 1;

      if (isValidBall) {
        strikerStats.ballsFaced += 1;
      }

      strikerStats.strikeRate = strikerStats.ballsFaced > 0
        ? Number(((strikerStats.runs / strikerStats.ballsFaced) * 100).toFixed(2))
        : 0;
    }

    if (isWicket && strikerStats) {
      innings.totalWickets += 1;
      strikerStats.isOut = true;
      strikerStats.dismissalType = data.wicket.dismissalType;

      if (data.wicket.bowler) {
        strikerStats.bowlerOut = data.wicket.bowler;
      }
      if (data.wicket.fielder) {
        strikerStats.fielderOut = data.wicket.fielder;
      }

      const overNumber = Math.floor(innings.totalBalls / 6) + (innings.totalBalls % 6) / 10;
      innings.fallOfWickets.push({
        runs: innings.totalRuns,
        wickets: innings.totalWickets,
        player: strikerStats.player,
        over: overNumber
      });
    }

    let bowlerStats = bowlerObjectId
      ? innings.bowling.find(b => b.player.toString() === bowlerObjectId.toString())
      : null;

    if (bowlerObjectId && !bowlerStats) {
      bowlerStats = {
        player: bowlerObjectId,
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
    }

    const runsConcededByBowler = (() => {
      let total = 0;
      if (isWide) {
        total += wideRuns;
        // Add additional runs scored on wide ball (similar to no-ball)
        if (!isBye && !isLegBye) {
          total += batRuns;
        }
      }
      if (isNoBall) {
        total += noBallPenalty;
        if (!isBye && !isLegBye) {
          total += batRuns;
        }
      } else if (!isWide && !isBye && !isLegBye) {
        total += batRuns;
      }
      return total;
    })();

    let wasMaiden = false;
    let overRunsAfterBall = 0;

    if (bowlerStats) {
      bowlerStats.runs += runsConcededByBowler;
      if (isWicket && !isNoBall) {
        bowlerStats.wickets += 1;
      }
      if (isWide) {
        bowlerStats.wides += wideRuns;
      }
      if (isNoBall) {
        bowlerStats.noBalls += 1;
      }

      bowlerStats.currentOverRuns = (bowlerStats.currentOverRuns || 0) + runsConcededByBowler;
      overRunsAfterBall = bowlerStats.currentOverRuns;

      if (isValidBall) {
        bowlerStats.ballsBowled = (bowlerStats.ballsBowled || 0) + 1;
        if (bowlerStats.ballsBowled % 6 === 0) {
          completedOverByBowler = true;
          if (overRunsAfterBall === 0) {
            bowlerStats.maidens += 1;
            wasMaiden = true;
          }
          bowlerStats.currentOverRuns = 0;
        }
      }

      const convertBallsToOvers = (balls) => {
        const completedOvers = Math.floor(balls / 6);
        const remainingBalls = balls % 6;
        return Number(`${completedOvers}.${remainingBalls}`);
      };

      const ballsBowled = bowlerStats.ballsBowled || 0;
      bowlerStats.overs = convertBallsToOvers(ballsBowled);

      if (ballsBowled > 0) {
        bowlerStats.economy = Number((bowlerStats.runs / (ballsBowled / 6)).toFixed(2));
      } else {
        bowlerStats.economy = 0;
      }
    }

    const runsImpactingStrike = batRuns + byeRuns + legByeRuns;
    let shouldSwapBatsmen = false;
    if (runsImpactingStrike % 2 === 1 && !isWicket) {
      shouldSwapBatsmen = true;
    }

    const ballsInCurrentOver = innings.totalBalls % 6;
    if (isValidBall && ballsInCurrentOver === 0 && innings.totalBalls > 0) {
      innings.totalOvers = Math.floor(innings.totalBalls / 6);
      if (!isWicket) {
        shouldSwapBatsmen = !shouldSwapBatsmen;
      } else {
        shouldSwapBatsmen = false;
      }
    }

    // Update partnerships using striker/non-striker at start of ball
    const ensurePartnership = () => {
      if (
        innings.partnerships.length === 0 &&
        strikerObjectId &&
        nonStrikerObjectId
      ) {
        innings.partnerships.push({
          batsman1: strikerObjectId,
          batsman2: nonStrikerObjectId,
          runs: 0,
          balls: 0
        });
      }
    };

    ensurePartnership();
    const activePartnership = innings.partnerships[innings.partnerships.length - 1];
    if (activePartnership) {
      activePartnership.runs += totalRunsThisBall;
      if (isValidBall) {
        activePartnership.balls += 1;
      }
    }

    // Update run-rate metrics
    const completedOversForRate = Math.floor(innings.totalBalls / 6);
    const ballsIntoCurrentOver = innings.totalBalls % 6;
    const oversForRate = completedOversForRate + (ballsIntoCurrentOver / 6);

    if (oversForRate > 0) {
      innings.runRate = Number((innings.totalRuns / oversForRate).toFixed(2));
    }

    if (innings.inningNumber === 2 && innings.target) {
      const runsNeeded = innings.target - innings.totalRuns;
      const ballsRemaining = (match.oversLimit * 6) - innings.totalBalls;
      const oversRemaining = ballsRemaining / 6;

      if (oversRemaining > 0) {
        innings.requiredRunRate = Number((runsNeeded / oversRemaining).toFixed(2));
      } else {
        innings.requiredRunRate = runsNeeded <= 0 ? 0 : null;
      }
    }

    let nextStriker = strikerObjectId;
    let nextNonStriker = nonStrikerObjectId;

    if (isWicket) {
      nextStriker = null;
    } else if (shouldSwapBatsmen && strikerObjectId && nonStrikerObjectId) {
      nextStriker = nonStrikerObjectId;
      nextNonStriker = strikerObjectId;
    }

    const strikeSwapped = Boolean(
      !isWicket &&
      nextStriker &&
      preStrikerId &&
      nextStriker.toString() !== preStrikerId
    );

    innings.currentStriker = nextStriker;
    innings.currentNonStriker = nextNonStriker;

    // Check if all wickets are out (playersPerTeam - 1, since one player is always not out)
    const maxWickets = match.playersPerTeam - 1;
    const allWicketsOut = innings.totalWickets >= maxWickets;

    if (allWicketsOut && !innings.isCompleted) {
      // Mark innings as completed
      innings.isCompleted = true;
      innings.totalOvers = Math.floor(innings.totalBalls / 6) + (innings.totalBalls % 6) / 10;

      // Clear current players to set isStarted to false
      innings.currentStriker = null;
      innings.currentNonStriker = null;
      innings.currentBowler = null;

      if (innings.inningNumber === 1) {
        // First innings ended - create second innings
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
      } else if (innings.inningNumber === 2) {
        // Second innings ended - calculate result and complete match
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

        // Complete the match
        match.status = "Completed";
        match.actualEndTime = new Date();

        // Mark all innings as completed
        match.innings.forEach(inn => {
          inn.isCompleted = true;
        });
      }
    }

    await match.save();

    // Update team statistics if match was just completed
    if (allWicketsOut && innings.isCompleted && innings.inningNumber === 2) {
      try {
        // Populate teams first to get team IDs
        await match.populate('teams.teamA teams.teamB');
        
        const winner = match.result?.winner;
        const winBy = match.result?.winBy;

        if (winner && winBy !== "tie") {
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
        } else if (winBy === "tie") {
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
        }
      } catch (teamError) {
        console.error('Error updating team statistics:', teamError);
        // Continue even if team stats update fails
      }
    }

    const overIndexBase = Math.max(0, isValidBall ? innings.totalBalls - 1 : innings.totalBalls);
    const computedOver = Math.floor(overIndexBase / 6) + 1;
    const computedBallNumber = (overIndexBase % 6) + 1;

    const ballData = {
      user: user.id,
      match_id: id,
      innings_id: innings.inningNumber.toString(),
      over: computedOver,
      ballNumber: computedBallNumber,
      striker: preStrikerId,
      nonStriker: preNonStrikerId,
      bowler: preBowlerId,
      runs: batRuns,
      batRuns,
      bowlerRunsConceded: runsConcededByBowler,
      totalRuns: innings.totalRuns,
      totalBalls: innings.totalBalls,
      totalWickets: innings.totalWickets,
      isValidBall,
      extras: {
        wide: wideRuns,
        noBall: noBallPenalty,
        bye: byeRuns,
        legBye: legByeRuns
      },
      wicket: isWicket ? {
        isWicket: true,
        dismissalType: data.wicket.dismissalType,
        bowler: data.wicket.bowler || null,
        fielder: data.wicket.fielder || null,
        batsmanOut: preStrikerId
      } : { isWicket: false },
      battingTeam: innings.battingTeam,
      bowlingTeam: innings.bowlingTeam,
      batting: innings.batting.map(b => ({
        player: b.player,
        runs: b.runs,
        balls: b.ballsFaced
      })),
      bowling: {
        bowler: preBowlerId,
        totalRuns: bowlerStats ? bowlerStats.runs : 0,
        totalBallBowled: bowlerStats ? bowlerStats.overs : 0,
        ballsBowled: bowlerStats ? bowlerStats.ballsBowled : 0,
        currentOverStats: {}
      },
      completedOver: completedOverByBowler,
      wasMaiden,
      overRunsAfterBall
      ,
      strikeSwapped
    };

    const newBall = await Ball.create(ballData);

    // Populate player references for response
    const populatePaths = [
      'innings.currentStriker',
      'innings.currentNonStriker',
      'innings.currentBowler'
    ];

    // If innings ended, populate teams for response
    if (allWicketsOut && innings.isCompleted) {
      populatePaths.push('teams.teamA', 'teams.teamB', 'innings.battingTeam', 'innings.bowlingTeam');
      
      // If match ended (second innings), also populate result.winner
      if (innings.inningNumber === 2) {
        populatePaths.push('result.winner');
      }
    }

    await match.populate(populatePaths);

    // Get the innings data to show in response
    // If innings ended, show the completed innings, otherwise show current innings
    const inningsDataToShow = allWicketsOut && innings.isCompleted 
      ? innings 
      : match.innings[match.currentInnings - 1];

    // Calculate overs display
    const completedOvers = Math.floor(inningsDataToShow.totalBalls / 6);
    const ballsInOver = inningsDataToShow.totalBalls % 6;
    const oversDisplay = `${completedOvers}.${ballsInOver}`;

    const response = {
      success: true,
      needsNewBatsman: isWicket && !allWicketsOut,
      needsNewBowler: completedOverByBowler,
      inningsEnded: allWicketsOut && innings.isCompleted,
      ball: {
        _id: newBall._id,
        over: newBall.over,
        ballNumber: newBall.ballNumber,
        striker: preStrikerId,
        nonStriker: preNonStrikerId,
        bowler: preBowlerId,
        batRuns: batRuns,
        extras: newBall.extras,
        strikeSwapped: strikeSwapped,
        completedOver: completedOverByBowler
      },
      innings: {
        totalRuns: inningsDataToShow.totalRuns,
        totalBalls: inningsDataToShow.totalBalls,
        overs: oversDisplay,
        runRate: inningsDataToShow.runRate,
        currentStriker: inningsDataToShow.currentStriker,
        currentNonStriker: inningsDataToShow.currentNonStriker,
        totalWickets: inningsDataToShow.totalWickets,
        isCompleted: inningsDataToShow.isCompleted
      }
    };

    // Add innings end information if innings ended
    if (allWicketsOut && innings.isCompleted) {
      if (innings.inningNumber === 1) {
        response.inningsEnded = true;
        response.message = 'First innings completed. All wickets out.';
        response.target = innings.totalRuns + 1;
        response.nextInnings = 2;
        response.matchStatus = match.status;
        response.needsPlayers = true;
      } else if (innings.inningNumber === 2) {
        response.inningsEnded = true;
        response.matchEnded = true;
        response.message = 'Match completed. All wickets out.';
        response.matchStatus = match.status;
        response.result = match.result;
        
        // Add winner name if available (already populated above)
        if (match.result?.winner && typeof match.result.winner === 'object') {
          response.result.winnerName = match.result.winner.name || null;
        }
      }
    }

    return Response.json(response);
  } catch (error) {
    console.error('Error creating ball data:', error);
    return Response.json({ 
      error: 'Failed to create ball data',
      details: error.message 
    }, { status: 500 });
  }
}