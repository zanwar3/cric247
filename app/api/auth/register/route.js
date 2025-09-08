import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "../../../../models/User";

export async function POST(request) {
  try {
    await dbConnect();
    
    const { name, email, password, confirmPassword } = await request.json();
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toJSON();
    
    return NextResponse.json(
      { 
        message: "User created successfully",
        user: userResponse 
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
