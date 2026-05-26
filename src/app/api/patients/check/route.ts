import { NextRequest, NextResponse } from "next/server";
import { checkDuplicatePatient } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const exclude = searchParams.get("exclude") ?? undefined;

  if (!email && !phone) {
    return NextResponse.json({ error: "email or phone required" }, { status: 400 });
  }

  return NextResponse.json(await checkDuplicatePatient(email, phone, exclude));
}
