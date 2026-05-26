import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/db";
import { requireProfile } from "@/lib/session";

export async function GET() {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    await getDashboardStats(profile.role, profile.email, profile.department)
  );
}
