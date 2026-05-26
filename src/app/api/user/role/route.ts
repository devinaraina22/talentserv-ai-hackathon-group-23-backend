import { NextResponse } from "next/server";
import { ensureUserProfile, getSessionUser } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await ensureUserProfile(session);
  return NextResponse.json({ profile });
}

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await ensureUserProfile(session);
  return NextResponse.json(profile);
}
