import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthenticatedUser, createUnauthorizedResponse } from "@/lib/auth-utils";

export async function GET(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    // Fetch user profile
    const userProfile = await User.findById(user.id).select('-password');
    
    if (!userProfile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return Response.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    if (error) {
      return createUnauthorizedResponse(error);
    }

    const data = await request.json();
    
    // Validate input
    if (!data.name || data.name.trim().length < 2) {
      return Response.json({ 
        error: 'Name is required and must be at least 2 characters long' 
      }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        name: data.name.trim(),
      },
      { 
        new: true, 
        runValidators: true,
        select: '-password' // Exclude password from response
      }
    );

    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return Response.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }
    
    return Response.json({ error: 'Failed to update user profile' }, { status: 500 });
  }
}
