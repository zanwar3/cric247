import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";
import Ball from "@/models/Ball";

export async function POST(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const ballData = await request.json();

    const match = await Match.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get current innings (latest one)
    let currentInnings = match.innings[match.innings.length - 1];
    if (!currentInnings) {
      // return NextResponse.json({ error: "No innings found" }, { status: 400 });
    }

    const ball = await Ball.create(ballData);

    // // Add ball to innings
    // currentInnings.ballByBall.push(ball);
    //
    // // Update innings totals
    // currentInnings.totalRuns += ball.totalRuns;
    //
    // // Update balls count (only for valid balls)
    // if (ball.isValidBall) {
    //   currentInnings.totalBalls += 1;
    //
    //   // Check if over is complete
    //   if (currentInnings.totalBalls % 6 === 0) {
    //     currentInnings.totalOvers = Math.floor(currentInnings.totalBalls / 6);
    //   }
    // }
    //
    // // Handle wickets
    // if (ball.wicket.isWicket) {
    //   currentInnings.totalWickets += 1;
    //
    //   // Update batsman stats
    //   const batsmanIndex = currentInnings.batting.findIndex(
    //     b => b.player?.toString() === ball.batsman?.toString()
    //   );
    //   if (batsmanIndex !== -1) {
    //     currentInnings.batting[batsmanIndex].dismissal = {
    //       type: ball.wicket.dismissalType,
    //       bowler: ball.wicket.bowler,
    //       fielder: ball.wicket.fielder
    //     };
    //   }
    // }
    //
    // // Update extras
    // if (ball.extras.isExtra) {
    //   switch (ball.extras.type) {
    //     case "wide":
    //       currentInnings.extras.wides += ball.extras.runs;
    //       break;
    //     case "noball":
    //       currentInnings.extras.noBalls += ball.extras.runs;
    //       break;
    //     case "bye":
    //       currentInnings.extras.byes += ball.extras.runs;
    //       break;
    //     case "legbye":
    //       currentInnings.extras.legByes += ball.extras.runs;
    //       break;
    //   }
    // }
    //
    // // Update batsman stats
    // const batsmanIndex = currentInnings.batting.findIndex(
    //   b => b.player?.toString() === ball.batsman?.toString()
    // );
    // if (batsmanIndex !== -1) {
    //   currentInnings.batting[batsmanIndex].runs += ball.runs;
    //   if (ball.isValidBall) {
    //     currentInnings.batting[batsmanIndex].balls += 1;
    //   }
    //   if (ball.runs === 4) {
    //     currentInnings.batting[batsmanIndex].fours += 1;
    //   }
    //   if (ball.runs === 6) {
    //     currentInnings.batting[batsmanIndex].sixes += 1;
    //   }
    //   // Update strike rate
    //   if (currentInnings.batting[batsmanIndex].balls > 0) {
    //     currentInnings.batting[batsmanIndex].strikeRate =
    //       (currentInnings.batting[batsmanIndex].runs / currentInnings.batting[batsmanIndex].balls) * 100;
    //   }
    // }
    //
    // // Update bowler stats
    // const bowlerIndex = currentInnings.bowling.findIndex(
    //   b => b.player?.toString() === ball.bowler?.toString()
    // );
    // if (bowlerIndex !== -1) {
    //   currentInnings.bowling[bowlerIndex].runs += ball.totalRuns;
    //   if (ball.isValidBall) {
    //     currentInnings.bowling[bowlerIndex].balls += 1;
    //     currentInnings.bowling[bowlerIndex].overs = Math.floor(currentInnings.bowling[bowlerIndex].balls / 6);
    //   }
    //   if (ball.wicket.isWicket && ["Bowled", "Caught", "LBW", "Stumped", "Hit Wicket"].includes(ball.wicket.dismissalType)) {
    //     currentInnings.bowling[bowlerIndex].wickets += 1;
    //   }
    //   if (ball.extras.type === "wide") {
    //     currentInnings.bowling[bowlerIndex].wides += 1;
    //   }
    //   if (ball.extras.type === "noball") {
    //     currentInnings.bowling[bowlerIndex].noBalls += 1;
    //   }
    //   // Update economy
    //   if (currentInnings.bowling[bowlerIndex].overs > 0) {
    //     currentInnings.bowling[bowlerIndex].economy =
    //       currentInnings.bowling[bowlerIndex].runs / currentInnings.bowling[bowlerIndex].overs;
    //   }
    // }
    //
    // // Save match
    // await match.save();

    return NextResponse.json({
      success: true,
      match,
      ball
    });

  } catch (error) {
    console.error("Error recording ball:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const ball = await Ball.findOne(
      { match_id: id } // filter
    ).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      ball
    });

  } catch (error) {
    console.error("Error reading ball:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


