import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get current innings (latest one)
    let currentInnings = match.innings[match.innings.length - 1];
    if (!currentInnings || !currentInnings.ballByBall.length) {
      return NextResponse.json({ error: "No balls to undo" }, { status: 400 });
    }

    // Get the last ball
    const lastBall = currentInnings.ballByBall.pop();

    // Reverse the ball's effects on innings totals
    currentInnings.totalRuns -= lastBall.totalRuns;
    
    // Update balls count (only for valid balls)
    if (lastBall.isValidBall) {
      currentInnings.totalBalls -= 1;
      currentInnings.totalOvers = Math.floor(currentInnings.totalBalls / 6);
    }

    // Handle wickets
    if (lastBall.wicket.isWicket) {
      currentInnings.totalWickets -= 1;
      
      // Restore batsman stats (remove dismissal)
      const batsmanIndex = currentInnings.batting.findIndex(
        b => b.player?.toString() === lastBall.batsman?.toString()
      );
      if (batsmanIndex !== -1) {
        currentInnings.batting[batsmanIndex].dismissal = {
          type: "Not Out"
        };
      }
    }

    // Reverse extras
    if (lastBall.extras.isExtra) {
      switch (lastBall.extras.type) {
        case "wide":
          currentInnings.extras.wides -= lastBall.extras.runs;
          break;
        case "noball":
          currentInnings.extras.noBalls -= lastBall.extras.runs;
          break;
        case "bye":
          currentInnings.extras.byes -= lastBall.extras.runs;
          break;
        case "legbye":
          currentInnings.extras.legByes -= lastBall.extras.runs;
          break;
      }
    }

    // Reverse batsman stats
    const batsmanIndex = currentInnings.batting.findIndex(
      b => b.player?.toString() === lastBall.batsman?.toString()
    );
    if (batsmanIndex !== -1) {
      currentInnings.batting[batsmanIndex].runs -= lastBall.runs;
      if (lastBall.isValidBall) {
        currentInnings.batting[batsmanIndex].balls -= 1;
      }
      if (lastBall.runs === 4) {
        currentInnings.batting[batsmanIndex].fours -= 1;
      }
      if (lastBall.runs === 6) {
        currentInnings.batting[batsmanIndex].sixes -= 1;
      }
      // Recalculate strike rate
      if (currentInnings.batting[batsmanIndex].balls > 0) {
        currentInnings.batting[batsmanIndex].strikeRate = 
          (currentInnings.batting[batsmanIndex].runs / currentInnings.batting[batsmanIndex].balls) * 100;
      } else {
        currentInnings.batting[batsmanIndex].strikeRate = 0;
      }
    }

    // Reverse bowler stats
    const bowlerIndex = currentInnings.bowling.findIndex(
      b => b.player?.toString() === lastBall.bowler?.toString()
    );
    if (bowlerIndex !== -1) {
      currentInnings.bowling[bowlerIndex].runs -= lastBall.totalRuns;
      if (lastBall.isValidBall) {
        currentInnings.bowling[bowlerIndex].balls -= 1;
        currentInnings.bowling[bowlerIndex].overs = Math.floor(currentInnings.bowling[bowlerIndex].balls / 6);
      }
      if (lastBall.wicket.isWicket && ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"].includes(lastBall.wicket.dismissalType)) {
        currentInnings.bowling[bowlerIndex].wickets -= 1;
      }
      if (lastBall.extras.type === "wide") {
        currentInnings.bowling[bowlerIndex].wides -= 1;
      }
      if (lastBall.extras.type === "noball") {
        currentInnings.bowling[bowlerIndex].noBalls -= 1;
      }
      // Recalculate economy
      if (currentInnings.bowling[bowlerIndex].overs > 0) {
        currentInnings.bowling[bowlerIndex].economy = 
          currentInnings.bowling[bowlerIndex].runs / currentInnings.bowling[bowlerIndex].overs;
      } else {
        currentInnings.bowling[bowlerIndex].economy = 0;
      }
    }

    // Ensure no negative values
    currentInnings.totalRuns = Math.max(0, currentInnings.totalRuns);
    currentInnings.totalWickets = Math.max(0, currentInnings.totalWickets);
    currentInnings.totalBalls = Math.max(0, currentInnings.totalBalls);
    currentInnings.totalOvers = Math.max(0, currentInnings.totalOvers);

    // Save match
    await match.save();

    return NextResponse.json({ 
      success: true, 
      match,
      undoneAt: new Date(),
      removedBall: lastBall
    });

  } catch (error) {
    console.error("Error undoing ball:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
