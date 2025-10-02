import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Team from "@/models/Team";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const team = await Team.findById(id).populate('players.player', 'name role battingStyle bowlingStyle experience age');

    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    return Response.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return Response.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const data = await request.json();

    const updateData = {
      name: data.name,
      city: data.city,
      description: data.description,
      founded: data.founded,
      homeGround: data.homeGround,
      captain: data.captain || '',
      coach: data.coach || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      slug: data.slug,
    };

    const team = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    return Response.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Team name already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const deletedTeam = await Team.findByIdAndDelete(id);

    if (!deletedTeam) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    return Response.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return Response.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}


