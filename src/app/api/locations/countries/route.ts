import { NextResponse } from "next/server";
import { listCountries } from "@/lib/locations";

export async function GET() {
  return NextResponse.json(
    { countries: listCountries() },
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    }
  );
}
