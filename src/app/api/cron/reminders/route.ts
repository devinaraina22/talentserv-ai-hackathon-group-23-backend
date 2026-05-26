import { NextRequest, NextResponse } from "next/server";
import { processDueDayBeforeReminders, isEmailConfigured } from "@/lib/notifications";

/**
 * Call daily (e.g. 9 AM) to email patients whose appointment is tomorrow.
 * Protect with CRON_SECRET header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && (!secret || auth !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueDayBeforeReminders();

  return NextResponse.json({
    ...result,
    emailConfigured: isEmailConfigured(),
    ranAt: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
