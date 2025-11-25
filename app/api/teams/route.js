import dbConnect from "@/lib/mongodb";
import { Team } from "@/lib/models";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Fetch only teams belonging to the authenticated user
    const teams = await Team.find({ user: user.id })
      .sort({ createdAt: -1 });
    
    return Response.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return Response.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(req);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const data = await req.json();
    
    // Create team with user reference
    const teamData = {
      user: user.id, // Add user reference
      name: data.name,
      slug: data.slug,
      city: data.city,
      captain: data.captain,
      coach: data.coach || '',
      founded: data.founded ? data.founded : undefined,
      description: data.description || '',
      homeGround: data.homeGround || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    const newTeam = await Team.create(teamData);
    
    return Response.json(newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'name') {
        return Response.json({ error: 'Team name already exists' }, { status: 400 });
      } else if (field === 'slug') {
        return Response.json({ error: 'Team slug already exists' }, { status: 400 });
      }
      return Response.json({ error: 'Duplicate entry' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create team' }, { status: 500 });
  }
}