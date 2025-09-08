import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const tournament = await Tournament.findById(id)
      .populate('teams.team', 'name shortName logo captain viceCaptain')
      .populate('winner', 'name shortName logo')
      .populate('runnerUp', 'name shortName logo')
      .populate({
        path: 'matches',
        populate: {
          path: 'teams.teamA teams.teamB result.winner',
          select: 'name shortName logo'
        }
      });
    
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
    
    const updateData = {
      name: data.name,
      description: data.description,
      format: data.format,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
      venue: data.venue,
      organizer: data.organizer || {},
      prizePool: data.prizePool || {},
      entryFee: data.entryFee,
      maxTeams: data.maxTeams,
      minTeams: data.minTeams,
      status: data.status,
      rules: data.rules || {},
      isPublic: data.isPublic
    };

    const tournament = await Tournament.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    )
    .populate('teams.team', 'name shortName logo')
    .populate('winner', 'name shortName')
    .populate('runnerUp', 'name shortName');
    
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


