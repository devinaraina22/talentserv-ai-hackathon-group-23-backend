import { cookies, headers } from "next/headers";
import { getRoleAssignmentById } from "./db";
import {
  demoSessionUserId,
  demoStaffDisplayName,
  isPatientSession,
  resolveDemoSessionPayload,
  type DemoSessionPayload,
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

function payloadToUser(payload: DemoSessionPayload): DemoSessionUser {
  return {
    userId: demoSessionUserId(payload),
    email: payload.email,
    name: payload.name,
    role: payload.role,
    department: payload.department,
  };
}

function userFromHeaders(h: Headers): DemoSessionUser | null {
  const role = h.get("x-demo-role") as UserRole | null;
  const email = h.get("x-demo-email");
  const name = h.get("x-demo-name");
  if (!role || !email || !name) return null;

  const staffId = h.get("x-demo-staff-id") ?? undefined;
  const department = h.get("x-demo-department") ?? undefined;
  return payloadToUser({
    role,
    email,
    name,
    staffId,
    department: department || undefined,
  });
}

async function userFromLegacyStaffId(staffId: string): Promise<DemoSessionUser | null> {
  const assignment = await getRoleAssignmentById(staffId);
  if (!assignment) return null;
  return payloadToUser({
    role: assignment.role,
    email: assignment.email,
    name: demoStaffDisplayName(assignment.email, assignment.name),
    staffId: assignment.id,
    department: assignment.department,
  });
}

export async function getDemoSessionUser(): Promise<DemoSessionUser | null> {
  if (!isDemoLoginEnabled()) return null;

  const h = await headers();
  if (h.get("authorization") === `Bearer ${DEMO_BEARER}`) {
    const fromHeaders = userFromHeaders(h);
    if (fromHeaders) return fromHeaders;

    const staffId = h.get("x-demo-staff-id");
    if (staffId) {
      const legacy = await userFromLegacyStaffId(staffId);
      if (legacy) return legacy;
    }
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!fromCookie) return null;

  const payload = resolveDemoSessionPayload(fromCookie);
  if (payload) return payloadToUser(payload);

  if (!isPatientSession(fromCookie)) {
    return userFromLegacyStaffId(fromCookie);
  }

  return null;
}
