import dbConnect from "@/lib/mongodb";
import Ball from "@/models/Ball";
import Match from "@/models/Match";
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

    const totalRunsThisBall = batRuns + byeRuns + legByeRuns + wideRuns + noBallPenalty;

    innings.totalRuns += totalRunsThisBall;
    if (isValidBall) {
      innings.totalBalls += 1;
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

    let completedOverByBowler = false;
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

    await match.save();

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
    await match.populate([
      'innings.currentStriker',
      'innings.currentNonStriker',
      'innings.currentBowler'
    ]);

    const currentInningsData = match.innings[currentInningsIndex];

    // Calculate overs display
    const completedOvers = Math.floor(currentInningsData.totalBalls / 6);
    const ballsInOver = currentInningsData.totalBalls % 6;
    const oversDisplay = `${completedOvers}.${ballsInOver}`;

    return Response.json({
      success: true,
      needsNewBatsman: isWicket,
      needsNewBowler: completedOverByBowler,
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
        totalRuns: currentInningsData.totalRuns,
        totalBalls: currentInningsData.totalBalls,
        overs: oversDisplay,
        runRate: currentInningsData.runRate,
        currentStriker: currentInningsData.currentStriker,
        currentNonStriker: currentInningsData.currentNonStriker
      }
    });
  } catch (error) {
    console.error('Error creating ball data:', error);
    return Response.json({ 
      error: 'Failed to create ball data',
      details: error.message 
    }, { status: 500 });
  }
}