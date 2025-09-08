import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";

export async function GET() {
  try {
    await dbConnect();
    const tournaments = await Tournament.find({})
      .populate('teams.team', 'name shortName logo')
      .populate('winner', 'name shortName')
      .populate('runnerUp', 'name shortName')
      .populate('matches')
      .sort({ createdAt: -1 });
    
    return Response.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return Response.json({ error: 'Failed to fetch tournaments' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    
    const tournamentData = {
      name: data.name,
      description: data.description || '',
      format: data.format,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : undefined,
      venue: data.venue || '',
      organizer: data.organizer || {},
      prizePool: data.prizePool || {},
      entryFee: data.entryFee || 0,
      maxTeams: data.maxTeams || 16,
      minTeams: data.minTeams || 4,
      status: data.status || 'Draft',
      rules: data.rules || {
        oversPerMatch: 20,
        playersPerTeam: 11,
        powerplayOvers: 6,
        duckworthLewis: false,
        supersOver: false
      },
      isPublic: data.isPublic !== undefined ? data.isPublic : true
    };

    const newTournament = await Tournament.create(tournamentData);
    
    // Populate the created tournament before returning
    const populatedTournament = await Tournament.findById(newTournament._id)
      .populate('teams.team', 'name shortName logo');
    
    return Response.json(populatedTournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return Response.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}


