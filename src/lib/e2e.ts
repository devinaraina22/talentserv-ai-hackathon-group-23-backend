import { cookies, headers } from "next/headers";
import type { UserRole } from "./types";

export const E2E_BEARER = "e2e-test-token";
export const E2E_ROLE_COOKIE = "medibook_e2e_role";

export function isE2eMode(): boolean {
  return process.env.E2E_TEST_MODE === "true";
}

const E2E_USERS: Record<
  UserRole,
  { userId: string; email: string; name: string; role: UserRole }
> = {
  Admin: {
    userId: "e2e-admin",
    email: "devina.raina@talentserv.co.in",
    name: "E2E Admin",
    role: "Admin",
  },
  Patient: {
    userId: "e2e-patient",
    email: "riya@example.com",
    name: "Riya Sharma",
    role: "Patient",
  },
  Receptionist: {
    userId: "e2e-receptionist",
    email: "reception@clinic.demo",
    name: "E2E Receptionist",
    role: "Receptionist",
  },
  Doctor: {
    userId: "e2e-doctor",
    email: "doctor@clinic.demo",
    name: "E2E Doctor",
    role: "Doctor",
  },
};

export function parseE2eRole(value: string | null | undefined): UserRole {
  if (value === "Patient" || value === "Admin" || value === "Doctor" || value === "Receptionist") {
    return value;
  }
  return "Admin";
}

export async function getE2eRoleFromRequest(): Promise<UserRole> {
  const h = await headers();
  const fromHeader = h.get("x-e2e-role");
  if (fromHeader) return parseE2eRole(fromHeader);
  const cookieStore = await cookies();
  return parseE2eRole(cookieStore.get(E2E_ROLE_COOKIE)?.value);
}

export function getE2eUser(role?: UserRole) {
  const resolved = role ?? "Admin";
  return E2E_USERS[resolved];
}

export async function getE2eSessionUser(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  if (!isE2eMode()) return null;
  const h = await headers();
  if (h.get("authorization") !== `Bearer ${E2E_BEARER}`) return null;
  const role = await getE2eRoleFromRequest();
  const user = E2E_USERS[role];
  return { userId: user.userId, email: user.email, name: user.name };
}
