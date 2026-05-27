import { NextRequest, NextResponse } from "next/server";
import { createRoleAssignment, deleteRoleAssignment, listRoleAssignments, logAudit } from "@/lib/db";
import { hasPermission } from "@/lib/auth";
import { requireProfile } from "@/lib/session";
import { roleAssignmentSchema } from "@/lib/validation";
import { friendlyError } from "@/lib/user-messages";

export async function GET() {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "admin:all")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignments = await listRoleAssignments();
  return NextResponse.json(assignments);
}

export async function POST(request: NextRequest) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "admin:all")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = roleAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the staff form and try again." },
        { status: 400 }
      );
    }

    const record = await createRoleAssignment(parsed.data);
    await logAudit({
      user_id: profile.clerk_user_id,
      user_email: profile.email,
      user_role: profile.role,
      action: "CREATE",
      entity_type: "patient",
      entity_id: record.id,
      details: `Staff access: ${record.email} → ${record.role}`,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save staff access";
    return NextResponse.json({ error: friendlyError(message) }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  let profile;
  try {
    profile = await requireProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(profile.role, "admin:all")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing staff record id" }, { status: 400 });
  }

  const removed = await deleteRoleAssignment(id);
  if (!removed) {
    return NextResponse.json({ error: "Staff record not found" }, { status: 404 });
  }

  await logAudit({
    user_id: profile.clerk_user_id,
    user_email: profile.email,
    user_role: profile.role,
    action: "DELETE",
    entity_type: "patient",
    entity_id: id,
    details: "Removed staff role assignment",
  });

  return NextResponse.json({ ok: true });
}
