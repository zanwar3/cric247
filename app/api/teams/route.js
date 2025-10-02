import dbConnect from "@/lib/mongodb";
import Team from "@/models/Team";

export async function GET() {
  try {
    await dbConnect();
    const teams = await Team.find({})
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
    const data = await req.json();
    
    // Create team with basic info first
    const teamData = {
      name: data.name,
      city: data.city,
      captain: data.captain,
      coach: data.coach || '',
      founded: data.founded ? data.founded : undefined,
      description: data.description || '',
      homeGround: data.homeGround || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      slug: data.slug,
    };

    const newTeam = await Team.create(teamData);
    
    return Response.json(newTeam, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Team name already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create team' }, { status: 500 });
  }
}


