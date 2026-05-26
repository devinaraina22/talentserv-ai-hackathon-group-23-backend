import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getHealthIntake, getPatient, updatePatient } from "@/lib/db";
import { patientSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const health = await getHealthIntake(id);
  return NextResponse.json({ patient, health: health ?? null });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = patientSchema.safeParse({ ...body, patient_id: id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { patient_id, ...rest } = parsed.data;
    void patient_id;
    const patient = await updatePatient(id, rest);
    return NextResponse.json(patient);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update patient";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
