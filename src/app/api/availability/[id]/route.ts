import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth";
import { deleteAvailability, logAudit } from "@/lib/db";
import { requireProfile } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "availability:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await deleteAvailability(id);
  await logAudit({
    user_id: profile.clerk_user_id,
    user_email: profile.email,
    user_role: profile.role,
    action: "DELETE",
    entity_type: "availability",
    entity_id: id,
    details: "Removed availability block",
  });

  return NextResponse.json({ ok: true });
}
