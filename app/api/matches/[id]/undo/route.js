import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Match, Ball } from "@/lib/models";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse, checkResourceOwnership } from "@/lib/auth-utils";

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Check if match belongs to user
    const match = await Match.findOne({
      _id: id,
      user: user.id,
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get current innings
    const currentInningsIndex = match.currentInnings - 1;
    const innings = match.innings[currentInningsIndex];

    if (!innings) {
      return NextResponse.json({ error: "No active innings found" }, { status: 400 });
    }

    // Find the latest ball for this match
    const ballToUndo = await Ball.findOne({
      match_id: id,
      user: user.id,
      innings_id: innings.inningNumber.toString()
    }).sort({ createdAt: -1 });

    if (!ballToUndo) {
      return NextResponse.json({ error: "No ball to undo" }, { status: 404 });
    }

    const extrasRecorded = ballToUndo.extras || {};
    const toNumber = (value) => {
      if (typeof value === "number" && !Number.isNaN(value)) return value;
      if (typeof value === "boolean") return value ? 1 : 0;
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const wideRuns = toNumber(extrasRecorded.wide);
    const noBallPenalty = toNumber(extrasRecorded.noBall);
    const byeRuns = toNumber(extrasRecorded.bye);
    const legByeRuns = toNumber(extrasRecorded.legBye);
    const isWide = wideRuns > 0;
    const isNoBall = noBallPenalty > 0;
    const isBye = byeRuns > 0;
    const isLegBye = legByeRuns > 0;
    const isWicket = ballToUndo.wicket?.isWicket || false;
    const isValidBall = Boolean(ballToUndo.isValidBall);

    const batRuns = Number.isFinite(ballToUndo.batRuns)
      ? ballToUndo.batRuns
      : (!isBye && !isLegBye ? (ballToUndo.runs || 0) : 0);

    const runsConcededByBowler = Number.isFinite(ballToUndo.bowlerRunsConceded)
      ? ballToUndo.bowlerRunsConceded
      : (() => {
          let total = 0;
          if (isWide) total += wideRuns || 1;
          if (isNoBall) {
            total += noBallPenalty || 1;
            if (!isBye && !isLegBye) total += batRuns;
          } else if (!isWide && !isBye && !isLegBye) {
            total += batRuns;
          }
          return total;
        })();

    const totalRunsToReverse = batRuns + byeRuns + legByeRuns + wideRuns + noBallPenalty;

    innings.totalRuns = Math.max(0, innings.totalRuns - totalRunsToReverse);
    if (isValidBall) {
      innings.totalBalls = Math.max(0, innings.totalBalls - 1);
    }

    innings.extras.byes = Math.max(0, innings.extras.byes - byeRuns);
    innings.extras.legByes = Math.max(0, innings.extras.legByes - legByeRuns);
    innings.extras.wides = Math.max(0, innings.extras.wides - wideRuns);
    innings.extras.noBalls = Math.max(0, innings.extras.noBalls - noBallPenalty);

    const strikerId = ballToUndo.striker;
    if (strikerId) {
      const strikerStats = innings.batting.find(b => b.player.toString() === strikerId.toString());
      if (strikerStats) {
        strikerStats.runs -= batRuns;
        if (batRuns === 4) strikerStats.fours -= 1;
        if (batRuns === 6) strikerStats.sixes -= 1;

        if (isValidBall) {
          strikerStats.ballsFaced -= 1;
        }

        strikerStats.strikeRate = strikerStats.ballsFaced > 0
          ? Number(((strikerStats.runs / strikerStats.ballsFaced) * 100).toFixed(2))
          : 0;

        if (isWicket) {
          strikerStats.isOut = false;
          strikerStats.dismissalType = null;
          strikerStats.bowlerOut = null;
          strikerStats.fielderOut = null;
          innings.totalWickets = Math.max(0, innings.totalWickets - 1);
          innings.fallOfWickets.pop();
        }
      }
    }

    const bowlerId = ballToUndo.bowler;
    if (bowlerId) {
      const bowlerStats = innings.bowling.find(b => b.player.toString() === bowlerId.toString());
      if (bowlerStats) {
        bowlerStats.runs -= runsConcededByBowler;
        if (isWicket && !isNoBall) {
          bowlerStats.wickets = Math.max(0, bowlerStats.wickets - 1);
        }
        if (isWide) {
          bowlerStats.wides = Math.max(0, bowlerStats.wides - wideRuns);
        }
        if (isNoBall) {
          bowlerStats.noBalls = Math.max(0, bowlerStats.noBalls - 1);
        }

        if (ballToUndo.completedOver) {
          if (ballToUndo.wasMaiden) {
            bowlerStats.maidens = Math.max(0, bowlerStats.maidens - 1);
          }
          bowlerStats.currentOverRuns = Math.max(
            0,
            (ballToUndo.overRunsAfterBall || 0) - runsConcededByBowler
          );
        } else {
          bowlerStats.currentOverRuns = Math.max(
            0,
            (bowlerStats.currentOverRuns || 0) - runsConcededByBowler
          );
        }

        if (isValidBall && bowlerStats.ballsBowled > 0) {
          bowlerStats.ballsBowled -= 1;
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
    }

    if (innings.partnerships.length > 0) {
      const currentPartnership = innings.partnerships[innings.partnerships.length - 1];
      currentPartnership.runs -= totalRunsToReverse;
      if (isValidBall) {
        currentPartnership.balls -= 1;
      }

      if (currentPartnership.runs <= 0 && currentPartnership.balls <= 0) {
        innings.partnerships.pop();
      }
    }

    const completedOversForRate = Math.floor(innings.totalBalls / 6);
    const ballsInOver = innings.totalBalls % 6;
    const oversForRate = completedOversForRate + (ballsInOver / 6);

    innings.runRate = oversForRate > 0
      ? Number((innings.totalRuns / oversForRate).toFixed(2))
      : 0;

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

    innings.totalOvers = Math.floor(innings.totalBalls / 6);

    if (strikerId) {
      innings.currentStriker = strikerId;
    }
    if (ballToUndo.nonStriker) {
      innings.currentNonStriker = ballToUndo.nonStriker;
    }
    if (bowlerId) {
      innings.currentBowler = bowlerId;
    }

    // Save match
    await match.save();

    // Delete the ball
    await Ball.deleteOne({ 
      _id: ballToUndo._id,
      user: user.id
    });

    // Populate player references for response
    await match.populate([
      'innings.currentStriker',
      'innings.currentNonStriker',
      'innings.currentBowler'
    ]);

    const currentInningsData = match.innings[currentInningsIndex];

    return NextResponse.json({
      success: true,
      message: "Ball undone successfully",
      innings: {
        totalRuns: currentInningsData.totalRuns,
        totalBalls: currentInningsData.totalBalls,
        currentStriker: currentInningsData.currentStriker,
        currentNonStriker: currentInningsData.currentNonStriker,
        currentBowler: currentInningsData.currentBowler,
        runRate: currentInningsData.runRate
      }
    });

  } catch (error) {
    console.error("Error undoing ball:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}