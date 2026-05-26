import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "MediBook Backend API",
    version: "1.0.0",
    docs: "See README.md — all routes under /api/*",
  });
}
