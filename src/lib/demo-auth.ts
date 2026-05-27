import { cookies, headers } from "next/headers";
import { getRoleAssignmentById } from "./db";
import {
  demoPatientUserId,
  demoStaffDisplayName,
  isPatientSession,
  nameFromEmail,
  parsePatientSession,
  type DemoPatientSession,
} from "./demo-session";
import type { UserRole } from "./types";

export const DEMO_BEARER = "demo-login-token";
export const DEMO_SESSION_COOKIE = "medibook_demo_session";

export const DEMO_PATIENT = {
  userId: "demo-patient",
  email: "riya@example.com",
  name: "Riya Sharma (Demo Patient)",
};

export type DemoSessionUser = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
};

export function isDemoLoginEnabled(): boolean {
  return (
    process.env.DEMO_LOGIN === "true" ||
    process.env.NEXT_PUBLIC_DEMO_LOGIN === "true"
  );
}

function patientFromPayload(payload: DemoPatientSession): DemoSessionUser {
  return {
    userId: demoPatientUserId(payload.email),
    email: payload.email,
    name: payload.name,
    role: "Patient",
  };
}

function patientFromHeaders(h: Headers): DemoSessionUser | null {
  const email = h.get("x-demo-email");
  const name = h.get("x-demo-name");
  if (!email || !name) return null;
  return patientFromPayload({ email, name });
}

function resolvePatientSession(value: string): DemoSessionUser | null {
  if (value === "patient") {
    return { ...DEMO_PATIENT, role: "Patient" };
  }
  const payload = parsePatientSession(value);
  if (!payload) return null;
  return patientFromPayload(payload);
}

export async function getDemoSessionUser(): Promise<DemoSessionUser | null> {
  if (!isDemoLoginEnabled()) return null;

  const h = await headers();
  if (h.get("authorization") !== `Bearer ${DEMO_BEARER}`) return null;

  if (h.get("x-demo-as-patient") === "true") {
    return patientFromHeaders(h) ?? { ...DEMO_PATIENT, role: "Patient" };
  }

  const staffId = h.get("x-demo-staff-id");
  if (staffId) {
    const assignment = await getRoleAssignmentById(staffId);
    if (!assignment) return null;
    return {
      userId: `demo-${assignment.id}`,
      email: assignment.email,
      name: demoStaffDisplayName(assignment.email, assignment.name),
      role: assignment.role,
      department: assignment.department,
    };
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!fromCookie) return null;

  if (isPatientSession(fromCookie)) {
    return resolvePatientSession(fromCookie);
  }

  const assignment = await getRoleAssignmentById(fromCookie);
  if (!assignment) return null;
  return {
    userId: `demo-${assignment.id}`,
    email: assignment.email,
    name: demoStaffDisplayName(assignment.email, assignment.name),
    role: assignment.role,
    department: assignment.department,
  };
}
