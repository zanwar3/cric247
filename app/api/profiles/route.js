import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Fetch only profiles belonging to the authenticated user
    const profiles = await Profile.find({ user: user.id })
      .sort({ createdAt: -1 });
    
    return Response.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return Response.json({ error: 'Failed to fetch profiles' }, { status: 500 });
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
    
    // Create profile with user reference
    const profileData = {
      user: user.id, // Add user reference
      ...data
    };

    const newProfile = await Profile.create(profileData);
    return Response.json(newProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    if (error.code === 11000) {
      return Response.json({ error: 'Profile with this email already exists' }, { status: 400 });
    }
    return Response.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}