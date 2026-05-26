import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import { createPatient, listPatients, logAudit } from "@/lib/db";
import { patientSchema } from "@/lib/validation";
import { requireProfile } from "@/lib/session";
import { friendlyError } from "@/lib/user-messages";

export async function GET() {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  if (profile.role === "Patient") {
    const { getPatientByEmail } = await import("@/lib/db");
    const patient = await getPatientByEmail(profile.email);
    return NextResponse.json(patient ? [patient] : []);
  }

  if (!hasPermission(profile.role, "patients:read")) {
    return NextResponse.json({ error: "You do not have permission to view patients." }, { status: 403 });
  }

  return NextResponse.json(await listPatients());
}

export async function POST(request: NextRequest) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  if (!hasPermission(profile.role, "patients:write")) {
    return NextResponse.json({ error: "You do not have permission to register patients." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = patientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the patient details and try again." }, { status: 400 });
    }
    const allowDuplicate = body.allow_duplicate === true;
    const patient = await createPatient(parsed.data, { allowDuplicate });
    await logAudit({
      user_id: profile.clerk_user_id,
      user_email: profile.email,
      user_role: profile.role,
      action: "CREATE",
      entity_type: "patient",
      entity_id: patient.patient_id,
      details: patient.full_name,
    });
    return NextResponse.json(patient, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create patient";
    const status = message.includes("Duplicate") ? 409 : 400;
    return NextResponse.json({ error: friendlyError(message) }, { status });
  }
}
