import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/lib/models";
import { verifyMobileToken, extractTokenFromHeader, generateMobileToken } from "@/lib/jwt-utils";

/**
 * Mobile Token Refresh Endpoint
 * Validates existing token and returns a new one
 * Useful for extending session without requiring re-login
 */
export async function POST(request) {
  try {
    await dbConnect();
    
    // Extract token from Authorization header
    const token = extractTokenFromHeader(request);
    
    if (!token) {
      return NextResponse.json(
        { error: "No token provided. Include token in Authorization header as 'Bearer <token>'" },
        { status: 401 }
      );
    }
    
    // Verify the token
    const decoded = verifyMobileToken(token);
    
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    
    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 403 }
      );
    }
    
    // Generate new token with fresh expiration
    const newToken = generateMobileToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
    
    // Return new token and updated user data
    return NextResponse.json(
      {
        success: true,
        message: "Token refreshed successfully",
        token: newToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          profile: user.profile,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

