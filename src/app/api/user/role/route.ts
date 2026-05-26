import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ROLES } from "@/lib/auth";
import { logAudit, upsertUserProfile } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

const schema = z.object({
  role: z.enum(ROLES as unknown as [string, ...string[]]),
  department: z.string().optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { getUserProfile } = await import("@/lib/db");
  const profile = await getUserProfile(session.userId);
  return NextResponse.json({ profile: profile ?? null });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const profile = await upsertUserProfile({
    clerk_user_id: session.userId,
    email: session.email,
    name: session.name,
    role: parsed.data.role as import("@/lib/types").UserRole,
    department: parsed.data.department,
  });

  await logAudit({
    user_id: session.userId,
    user_email: session.email,
    user_role: profile.role,
    action: "ASSIGN_ROLE",
    entity_type: "patient",
    entity_id: session.userId,
    details: `Role set to ${profile.role}`,
  });

  return NextResponse.json(profile);
}
