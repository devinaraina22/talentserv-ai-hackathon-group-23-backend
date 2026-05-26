import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import { listAuditLogs } from "@/lib/db";
import { requireProfile } from "@/lib/session";

export async function GET() {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "audit:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await listAuditLogs());
}
