import { NextResponse } from "next/server";
import { ensureUserProfile, getSessionUser } from "@/lib/session";

async function provisionProfile() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await ensureUserProfile(session);
    return { session, profile };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup failed";
    if (message.includes("DATABASE_URL is required")) {
      return NextResponse.json(
        {
          error:
            "Server database is not configured. Add Neon Postgres to the API project on Vercel.",
        },
        { status: 503 }
      );
    }
    console.error("[user/role]", err);
    return NextResponse.json({ error: "Could not save your profile. Try again." }, { status: 500 });
  }
}

export async function GET() {
  const result = await provisionProfile();
  if (result instanceof NextResponse) return result;
  return NextResponse.json({ profile: result.profile });
}

export async function POST() {
  const result = await provisionProfile();
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.profile);
}
