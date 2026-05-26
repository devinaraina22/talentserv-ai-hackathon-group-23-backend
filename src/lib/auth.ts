import type { UserRole } from "./types";

export const ROLES: UserRole[] = ["Admin", "Receptionist", "Doctor", "Patient"];

export type Permission =
  | "dashboard:view"
  | "patients:read"
  | "patients:write"
  | "appointments:read"
  | "appointments:write"
  | "appointments:status"
  | "availability:read"
  | "availability:manage"
  | "audit:read"
  | "reminders:send"
  | "receipt:view"
  | "admin:all";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: ["admin:all"],
  Receptionist: [
    "dashboard:view",
    "patients:read",
    "patients:write",
    "appointments:read",
    "appointments:write",
    "appointments:status",
    "availability:read",
    "audit:read",
    "reminders:send",
    "receipt:view",
  ],
  Doctor: [
    "dashboard:view",
    "patients:read",
    "appointments:read",
    "appointments:status",
    "availability:read",
    "availability:manage",
    "audit:read",
    "receipt:view",
  ],
  Patient: ["dashboard:view", "appointments:read", "appointments:write", "receipt:view"],
};

export function canSendReminders(role: UserRole): boolean {
  return hasPermission(role, "reminders:send");
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("admin:all") || perms.includes(permission);
}

export function canAccessNav(role: UserRole, href: string): boolean {
  const rules: Record<string, Permission> = {
    "/dashboard": "dashboard:view",
    "/patients": "patients:read",
    "/appointments": "appointments:read",
    "/availability": "availability:read",
    "/audit": "audit:read",
    "/reminders": "reminders:send",
  };
  for (const [path, perm] of Object.entries(rules)) {
    if (href.startsWith(path)) return hasPermission(role, perm);
  }
  return true;
}

export const ROLE_COLORS: Record<UserRole, string> = {
  Admin: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Receptionist: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  Doctor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Patient: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export const ROLE_BADGE_LIGHT: Record<UserRole, string> = {
  Admin: "bg-violet-100 text-violet-800",
  Receptionist: "bg-sky-100 text-sky-800",
  Doctor: "bg-emerald-100 text-emerald-800",
  Patient: "bg-amber-100 text-amber-800",
};
