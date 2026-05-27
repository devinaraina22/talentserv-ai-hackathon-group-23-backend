import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRoleAssignmentById, getRoleAssignmentForEmail } from "@/lib/db";
import { DEMO_PATIENT, isDemoLoginEnabled } from "@/lib/demo-auth";
import {
  demoPatientUserId,
  demoStaffDisplayName,
  encodePatientSession,
  nameFromEmail,
  parsePatientSession,
} from "@/lib/demo-session";
import type { UserRole } from "@/lib/types";

const STAFF_ROLES = ["Admin", "Receptionist", "Doctor"] as const;

function staffUser(assignment: {
  id: string;
  email: string;
  name: string;
  role: (typeof STAFF_ROLES)[number] | UserRole;
  department?: string;
}) {
  return {
    userId: `demo-${assignment.id}`,
    email: assignment.email,
    name: demoStaffDisplayName(assignment.email, assignment.name),
    role: assignment.role,
    department: assignment.department,
  };
}

const credentialsLoginSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().optional(),
    provider: z.enum(["google", "email"]).default("email"),
    role: z.enum(["Admin", "Receptionist", "Doctor", "Patient"]),
    asPatient: z.literal(true).optional(),
    name: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider === "email" && (!data.password || data.password.length < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required",
        path: ["password"],
      });
    }
  });

const legacyPatientSchema = z.object({
  asPatient: z.literal(true),
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(2, "Enter your name"),
});

const legacyStaffSchema = z.object({
  role: z.enum(STAFF_ROLES),
  email: z.string().email("Enter a valid email address"),
});

function resolveSessionUser(sessionId: string) {
  if (sessionId === "patient") {
    return { ...DEMO_PATIENT, role: "Patient" as UserRole };
  }

  const patient = parsePatientSession(sessionId);
  if (patient) {
    return {
      userId: demoPatientUserId(patient.email),
      email: patient.email,
      name: patient.name,
      role: "Patient" as UserRole,
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: "Sign-in is unavailable" }, { status: 403 });
  }

  const sessionId = request.nextUrl.searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ ok: true });
  }

  const patientUser = resolveSessionUser(sessionId);
  if (patientUser) {
    return NextResponse.json({ user: patientUser });
  }

  const assignment = await getRoleAssignmentById(sessionId);
  if (!assignment) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ user: staffUser(assignment) });
}

export async function POST(request: NextRequest) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: "Sign-in is unavailable" }, { status: 403 });
  }

  const body = await request.json();

  const legacyPatient = legacyPatientSchema.safeParse(body);
  if (legacyPatient.success) {
    const { email, name } = legacyPatient.data;
    const session = encodePatientSession({ email, name });
    return NextResponse.json({
      ok: true,
      session,
      user: {
        userId: demoPatientUserId(email),
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: "Patient",
      },
    });
  }

  const legacyStaff = legacyStaffSchema.safeParse(body);
  if (legacyStaff.success) {
    const { role, email } = legacyStaff.data;
    const assignment = await getRoleAssignmentForEmail(email);

    if (!assignment) {
      return NextResponse.json(
        { error: "This email is not registered for clinic staff access." },
        { status: 403 }
      );
    }

    if (assignment.role !== role) {
      return NextResponse.json(
        { error: `This email is not registered as ${role}.` },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      session: assignment.id,
      user: staffUser(assignment),
    });
  }

  const credentialsParsed = credentialsLoginSchema.safeParse(body);
  if (!credentialsParsed.success) {
    const message = credentialsParsed.error.issues[0]?.message ?? "Invalid sign-in details";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, role } = credentialsParsed.data;

  if (role === "Patient") {
    const normalizedEmail = email.toLowerCase().trim();
    const name = nameFromEmail(normalizedEmail);
    const session = encodePatientSession({ email: normalizedEmail, name });
    return NextResponse.json({
      ok: true,
      session,
      user: {
        userId: demoPatientUserId(normalizedEmail),
        email: normalizedEmail,
        name,
        role: "Patient",
      },
    });
  }

  const assignment = await getRoleAssignmentForEmail(email);

  if (!assignment) {
    return NextResponse.json(
      { error: "This email is not registered for clinic staff access." },
      { status: 403 }
    );
  }

  if (assignment.role !== role) {
    return NextResponse.json(
      { error: `This email is not registered as ${role}.` },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: assignment.id,
    user: staffUser(assignment),
  });
}
