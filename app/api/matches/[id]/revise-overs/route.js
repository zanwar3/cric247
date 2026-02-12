import dbConnect from "@/lib/mongodb";
import { Match } from "@/lib/models";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

/**
 * Revise (update) the overs limit for a match.
 * Body: { oversLimit: number }
 * Allowed when match status is "Scheduled" or "Live".
 * When Live: new oversLimit must be >= balls already bowled in current innings (as overs).
 */
async function reviseOversHandler(request, { params }) {
  try {
    await dbConnect();

    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;
    const data = await request.json();

    const raw = data.oversLimit;
    if (raw == null || (typeof raw !== "number" && typeof raw !== "string")) {
      return Response.json(
        { error: "oversLimit (number) is required" },
        { status: 400 }
      );
    }

    const oversLimit = Math.floor(Number(raw));
    if (Number.isNaN(oversLimit) || oversLimit < 1 || oversLimit > 50) {
      return Response.json(
        { error: "oversLimit must be between 1 and 50" },
        { status: 400 }
      );
    }

    const match = await Match.findOne({
      _id: id,
      user: user.id,
    });

    if (!match) {
      return Response.json({ error: "Match not found" }, { status: 404 });
    }

    const status = match.status || "Scheduled";
    if (status !== "Scheduled" && status !== "Live") {
      return Response.json(
        { error: "Overs can only be revised for Scheduled or Live matches" },
        { status: 400 }
      );
    }

    if (status === "Live" && match.innings && match.innings.length > 0) {
      const currentInnings = match.innings[match.currentInnings - 1];
      const totalBalls = currentInnings?.totalBalls ?? 0;
      const minOvers = Math.ceil(totalBalls / 6);
      if (oversLimit < minOvers) {
        return Response.json(
          {
            error: `Overs cannot be less than balls already bowled. Minimum overs: ${minOvers}`,
          },
          { status: 400 }
        );
      }
    }

    match.oversLimit = oversLimit;
    await match.save();

    return Response.json({
      success: true,
      message: "Match overs revised successfully",
      oversLimit: match.oversLimit,
    });
  } catch (error) {
    console.error("Error revising match overs:", error);
    return Response.json(
      { error: "Failed to revise match overs", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  return reviseOversHandler(request, { params });
}

export async function PUT(request, { params }) {
  return reviseOversHandler(request, { params });
}
