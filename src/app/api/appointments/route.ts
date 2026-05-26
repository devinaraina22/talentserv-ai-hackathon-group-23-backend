import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import { createAppointment, listAppointments, logAudit } from "@/lib/db";
import { appointmentSchema } from "@/lib/validation";
import { requireProfile } from "@/lib/session";
import { notifyBookingConfirmation } from "@/lib/notifications";
import { friendlyError } from "@/lib/user-messages";

export async function GET(request: NextRequest) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters: Parameters<typeof listAppointments>[0] = {
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    date: searchParams.get("date") ?? undefined,
  };

  if (profile.role === "Patient") filters.patientEmail = profile.email;
  else if (profile.role === "Doctor" && profile.department)
    filters.doctorDepartment = profile.department;

  return NextResponse.json(await listAppointments(filters));
}

export async function POST(request: NextRequest) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  if (!hasPermission(profile.role, "appointments:write")) {
    return NextResponse.json({ error: "You do not have permission to book appointments." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the appointment details and try again." }, { status: 400 });
    }
    const appointment = await createAppointment({
      ...parsed.data,
      appointment_type: parsed.data.appointment_type as "In-person" | "Online",
    });
    await logAudit({
      user_id: profile.clerk_user_id,
      user_email: profile.email,
      user_role: profile.role,
      action: "CREATE",
      entity_type: "appointment",
      entity_id: appointment.appointment_id,
      details: `${appointment.doctor_or_department} ${appointment.appointment_date}`,
    });

    let emailSent = false;
    try {
      const reminder = await notifyBookingConfirmation(appointment.appointment_id);
      emailSent = !!reminder && !reminder.simulated;
    } catch {
      /* booking saved even if email fails */
    }

    return NextResponse.json({ ...appointment, emailSent }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create appointment";
    const status = message.includes("already booked") || message.includes("not available") ? 409 : 400;
    return NextResponse.json({ error: friendlyError(message) }, { status });
  }
}
