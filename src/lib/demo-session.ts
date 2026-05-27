export type DemoPatientSession = {
  email: string;
  name: string;
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

export function demoPatientUserId(email: string): string {
  const slug = email.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `demo-patient-${slug || "guest"}`;
}

export function encodePatientSession(data: DemoPatientSession): string {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `p:${payload}`;
}

export function parsePatientSession(value: string): DemoPatientSession | null {
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
  return value === "patient" || value.startsWith("p:");
}
