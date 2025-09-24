import dbConnect from "@/lib/mongodb";
import Tournament from "@/models/Tournament";

export async function GET() {
  try {
    await dbConnect();
    const tournaments = await Tournament.find({})
      // .populate('teams.team', 'name shortName logo')
      // .populate('winner', 'name shortName')
      // .populate('runnerUp', 'name shortName')
      // .populate('matches')
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
    const newTournament = await Tournament.create(data);

    // Populate the created tournament before returning
    const populatedTournament = await Tournament.findById(newTournament._id);

    return Response.json(populatedTournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return Response.json({ error: 'Failed to create tournament' }, { status: 500 });
  }
}


