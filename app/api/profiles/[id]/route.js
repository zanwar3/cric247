import dbConnect from "@/lib/mongodb";
import { Profile } from "@/lib/models";

export async function PUT(request, { params }) {
  await dbConnect();
  const body = await request.json();
  const { id } = await params;
  const profile = await Profile.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!profile) {
    return Response.json({ success: false }, { status: 400 });
  }
  return Response.json({ success: true, data: profile });
}

export async function DELETE(request, { params }) {
  await dbConnect();
  const { id } = await params;
  const deletedProfile = await Profile.deleteOne({ _id: id });
  if (!deletedProfile) {
    return Response.json({ success: false }, { status: 400 });
  }
  return Response.json({ success: true, data: {} });
}

export async function GET(request, { params }) {
  await dbConnect();
  const { id } = await params;
  const profile = await Profile.findById(id);
  if (!profile) {
    return Response.json({ success: false }, { status: 400 });
  }
  return Response.json({ success: true, data: profile });
}