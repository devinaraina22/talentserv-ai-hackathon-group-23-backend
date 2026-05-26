import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import {
  getAppointment,
  getHealthIntake,
  getPatient,
  logAudit,
  updateAppointmentStatus,
} from "@/lib/db";
import { appointmentStatusSchema } from "@/lib/validation";
import { requireProfile } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const appointment = await getAppointment(id);
  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patient = await getPatient(appointment.patient_id);
  const health = await getHealthIntake(appointment.patient_id);
  return NextResponse.json({ appointment, patient, health: health ?? null });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "appointments:status")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = appointmentStatusSchema.safeParse(body.status);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const appointment = await updateAppointmentStatus(id, parsed.data);
    await logAudit({
      user_id: profile.clerk_user_id,
      user_email: profile.email,
      user_role: profile.role,
      action: "UPDATE_STATUS",
      entity_type: "appointment",
      entity_id: id,
      details: `Status → ${parsed.data}`,
    });
    return NextResponse.json(appointment);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
