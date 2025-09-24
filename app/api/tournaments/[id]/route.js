import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const tournament = await Tournament.findById(id)
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
    const { id } = params;
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
    const { id } = params;

    const deletedTournament = await Tournament.findByIdAndDelete(id);

    if (!deletedTournament) {
      return Response.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return Response.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return Response.json({ error: 'Failed to delete tournament' }, { status: 500 });
  }
}


