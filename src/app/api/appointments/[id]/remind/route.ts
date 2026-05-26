import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission } from "@/lib/auth";
import { logAudit } from "@/lib/db";
import { notifyManualReminder } from "@/lib/notifications";
import { requireProfile } from "@/lib/session";

const schema = z.object({ channel: z.enum(["email", "sms"]) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "reminders:send")) {
    return NextResponse.json(
      { error: "Only Admin and Receptionist can send patient reminders" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  try {
    const reminder = await notifyManualReminder(id, parsed.data.channel);
    await logAudit({
      user_id: profile.clerk_user_id,
      user_email: profile.email,
      user_role: profile.role,
      action: "SEND_REMINDER",
      entity_type: "reminder",
      entity_id: reminder.id,
      details: `${parsed.data.channel} ${reminder.reminder_type} → ${reminder.recipient}`,
    });
    return NextResponse.json(reminder);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
