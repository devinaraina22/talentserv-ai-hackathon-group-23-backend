import type { UserRole } from "./types";

const DEFAULT_ADMIN_EMAILS = ["devina.raina@talentserv.co.in"];

function adminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_ADMIN_EMAILS;
}

export function roleForEmail(email: string): UserRole {
  const normalized = email.toLowerCase().trim();
  if (adminEmails().some((e) => e.toLowerCase() === normalized)) return "Admin";
  return "Patient";
}
