import { NextRequest, NextResponse } from "next/server";
import { logAudit, upsertHealthIntake } from "@/lib/db";
import { getSessionUser, requireProfile } from "@/lib/session";
import { healthIntakeSchema } from "@/lib/validation";
import { friendlyError } from "@/lib/user-messages";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "medibook-api",
    e2e: process.env.E2E_TEST_MODE === "true",
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = healthIntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the health intake form and try again." },
        { status: 400 }
      );
    }

    const health = await upsertHealthIntake(parsed.data);
    await logAudit({
      user_id: profile.clerk_user_id,
      user_email: profile.email,
      user_role: profile.role,
      action: "UPDATE",
      entity_type: "health",
      entity_id: health.patient_id,
      details: health.visit_reason,
    });

    return NextResponse.json(health);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save health intake";
    return NextResponse.json({ error: friendlyError(message) }, { status: 400 });
  }
}
