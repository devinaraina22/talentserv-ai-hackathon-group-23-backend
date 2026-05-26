import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission } from "@/lib/auth";
import {
  createAvailability,
  getAvailabilityForDay,
  listAvailability,
  logAudit,
} from "@/lib/db";
import { requireProfile } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department") ?? undefined;
  const date = searchParams.get("date");

  if (department && date) {
    return NextResponse.json({
      slots: await getAvailabilityForDay(department, date),
    });
  }
  return NextResponse.json(await listAvailability(department));
}

const createSchema = z.object({
  doctor_or_department: z.string().min(2),
  day_of_week: z.number().int().min(0).max(6),
  time_slots: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "availability:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const record = await createAvailability(parsed.data);
  await logAudit({
    user_id: profile.clerk_user_id,
    user_email: profile.email,
    user_role: profile.role,
    action: "CREATE",
    entity_type: "availability",
    entity_id: record.id,
    details: `${record.doctor_or_department} day ${record.day_of_week}`,
  });

  return NextResponse.json(record, { status: 201 });
}
