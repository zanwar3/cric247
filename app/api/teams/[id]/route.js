import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import Team from "@/models/Team";
import { getAuthenticatedUser, createUnauthorizedResponse, createForbiddenResponse, checkResourceOwnership } from "@/lib/auth-utils";

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Find team and check ownership
    const team = await Team.findOne({
      _id: id,
      user: user.id,
    }).populate('players.player', 'name role battingStyle bowlingStyle experience age');

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
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;
    const data = await request.json();

    // Find team and check ownership
    const existingTeam = await Team.findOne({
      _id: id,
      user: user.id,
    });
    if (!existingTeam) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }

    const updateData = {
      name: data.name,
      slug: data.slug,
      city: data.city,
      description: data.description,
      founded: data.founded,
      homeGround: data.homeGround,
      captain: data.captain || '',
      coach: data.coach || '',
      isActive: data.isActive !== undefined ? data.isActive : true
    };

    const team = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return Response.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'name') {
        return Response.json({ error: 'Team name already exists' }, { status: 400 });
      } else if (field === 'slug') {
        return Response.json({ error: 'Team slug already exists' }, { status: 400 });
      }
      return Response.json({ error: 'Duplicate entry' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const { id } = await params;

    // Find team and check ownership
    const existingTeam = await Team.findOne({
      _id: id,
      user: user.id,
    });
    if (!existingTeam) {
      return Response.json({ error: 'Team not found' }, { status: 404 });
    }                                                     
    const deletedTeam = await Team.findByIdAndDelete(id);

    return Response.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return Response.json({ error: 'Failed to delete team' }, { status: 500 });
  }
}