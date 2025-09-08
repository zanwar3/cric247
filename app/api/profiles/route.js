import dbConnect from "@/lib/mongodb";
import Profile from "@/models/Profile";

export async function GET() {
  await dbConnect();
  const profiles = await Profile.find({});
  return Response.json(profiles);
}

export async function POST(req) {
  await dbConnect();
  const data = await req.json();
  const newProfile = await Profile.create(data);
  return Response.json(newProfile);
}
