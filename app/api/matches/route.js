import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";

export async function GET() {
  try {
    await dbConnect();
    const matches = await Match.find({})
      .sort({ scheduledDate: -1 });
    
    return Response.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    
    const matchData = {
      matchNumber: data.matchNumber || '',
      tournament: data.tournament || null,
      teams: {
        teamA: data.teams.teamA,
        teamB: data.teams.teamB
      },
      venue: data.venue || {},
      scheduledDate: new Date(data.scheduledDate),
      status: data.status || 'Scheduled',
      matchType: data.matchType || 'T20',
      officials: data.officials || {},
      notes: data.notes || ''
    };

    const newMatch = await Match.create(matchData);
    
    return Response.json(newMatch, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create match' }, { status: 500 });
  }
}


