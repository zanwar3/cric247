import dbConnect from "@/lib/mongodb";
import Match from "@/models/Match";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const match = await Match.findById(id);
    
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return Response.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    return Response.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const data = await request.json();
    
    const updateData = {
      matchNumber: data.matchNumber,
      teams: data.teams || {},
      venue: data.venue || {},
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      status: data.status,
      matchType: data.matchType,
      notes: data.notes
    };

    const match = await Match.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return Response.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update match' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const deletedMatch = await Match.findByIdAndDelete(id);
    
    if (!deletedMatch) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    return Response.json({ error: 'Failed to delete match' }, { status: 500 });
  }
}


