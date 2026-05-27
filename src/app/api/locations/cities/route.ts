import { NextResponse } from "next/server";
import { getCountryByCode } from "@/lib/countries";
import { listCitiesForCountry, searchCitiesForCountry } from "@/lib/locations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const query = searchParams.get("q")?.trim() ?? "";

  if (!code || code.length !== 2) {
    return NextResponse.json({ error: "Query param code (ISO-2) is required" }, { status: 400 });
  }

  const country = getCountryByCode(code);
  if (!country) {
    return NextResponse.json({ error: "Unsupported country code" }, { status: 400 });
  }

  if (query) {
    const suggestions = await searchCitiesForCountry(code, query, 10);
    return NextResponse.json(
      { country_code: code, country: country.name, query, suggestions },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        },
      }
    );
  }

  const cities = await listCitiesForCountry(code);

  return NextResponse.json(
    { country_code: code, country: country.name, cities },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
