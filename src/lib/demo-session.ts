import type { UserRole } from "./types";

export type DemoPatientSession = {
  email: string;
  name: string;
};

export type DemoSessionPayload = {
  role: UserRole;
  email: string;
  name: string;
  staffId?: string;
  department?: string;
};

export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "User";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return "User";
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export function demoStaffDisplayName(email: string, storedName?: string): string {
  const derived = nameFromEmail(email);
  if (!storedName?.trim()) return derived;
  const generic = new Set(["Clinic Admin", "Front Desk", "Dr. Demo", "Admin", "Receptionist", "Doctor"]);
  return generic.has(storedName.trim()) ? derived : storedName.trim();
}

export function demoSessionUserId(payload: DemoSessionPayload): string {
  if (payload.role === "Patient") return demoPatientUserId(payload.email);
  if (payload.staffId) return `demo-${payload.staffId}`;
  const slug = payload.email.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `demo-staff-${slug || "user"}`;
}

export function demoPatientUserId(email: string): string {
  const slug = email.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `demo-patient-${slug || "guest"}`;
}

export function encodeDemoSession(data: DemoSessionPayload): string {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `d:${payload}`;
}

export function parseDemoSession(value: string): DemoSessionPayload | null {
  if (!value.startsWith("d:")) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value.slice(2), "base64url").toString("utf8")
    ) as DemoSessionPayload;
    if (!parsed.email || !parsed.name || !parsed.role) return null;
    return {
      role: parsed.role,
      email: parsed.email.toLowerCase().trim(),
      name: parsed.name.trim(),
      staffId: parsed.staffId,
      department: parsed.department,
    };
  } catch {
    return null;
  }
}

export function encodePatientSession(data: DemoPatientSession): string {
  return encodeDemoSession({
    role: "Patient",
    email: data.email,
    name: data.name,
  });
}

export function parsePatientSession(value: string): DemoPatientSession | null {
  const demo = parseDemoSession(value);
  if (demo) return { email: demo.email, name: demo.name };
  if (!value.startsWith("p:")) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(value.slice(2), "base64url").toString("utf8")
    ) as DemoPatientSession;
    if (!parsed.email || !parsed.name) return null;
    return {
      email: parsed.email.toLowerCase().trim(),
      name: parsed.name.trim(),
    };
  } catch {
    return null;
  }
}

export function isPatientSession(value: string): boolean {
  if (value === "patient") return true;
  const demo = parseDemoSession(value);
  if (demo?.role === "Patient") return true;
  return value.startsWith("p:");
}

export function resolveDemoSessionPayload(value: string): DemoSessionPayload | null {
  const demo = parseDemoSession(value);
  if (demo) return demo;

  const legacyPatient = parsePatientSession(value);
  if (legacyPatient) {
    return { role: "Patient", email: legacyPatient.email, name: legacyPatient.name };
  }

  if (value === "patient") {
    return {
      role: "Patient",
      email: "riya@example.com",
      name: "Riya Sharma (Demo Patient)",
    };
  }

  return null;
}
