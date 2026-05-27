import { NextResponse } from "next/server";
import { listCitiesForCountry } from "@/lib/locations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code || code.length !== 2) {
    return NextResponse.json({ error: "Query param code (ISO-2) is required" }, { status: 400 });
  }

  const cities = await listCitiesForCountry(code);

  return NextResponse.json(
    { country_code: code, cities },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
