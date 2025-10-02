import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }
    const tournament = await Tournament.findOne({
      _id: id,
      user: user.id,
    })
      // .populate('teams.team', 'name shortName logo captain viceCaptain')
      // .populate('winner', 'name shortName logo')
      // .populate('runnerUp', 'name shortName logo')
      // .populate({
      //   path: 'matches',
      //   populate: {
      //     path: 'teams.teamA teams.teamB result.winner',
      //     select: 'name shortName logo'
      //   }
      // });
      //
    if (!tournament) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return Response.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return Response.json({ error: 'Failed to fetch tournament' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await request.json();


    const tournament = await Tournament.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    )

    if (!tournament) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return Response.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return Response.json({ error: 'Failed to update tournament' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const deletedTournament = await Tournament.findByIdAndDelete({
      _id: id,
      user: user.id,
    });

    if (!deletedTournament) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return Response.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return Response.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}


