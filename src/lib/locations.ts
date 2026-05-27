import { COUNTRIES, FALLBACK_CITIES, getCountryByCode, getCountryName } from "./countries";
import { getCached, setCached } from "./locations-cache";

const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function listCountries() {
  return COUNTRIES;
}

export async function listCitiesForCountry(countryCode: string): Promise<string[]> {
  const code = countryCode.toUpperCase();
  const cacheKey = `cities:${code}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const country = getCountryByCode(code);
  const countryName = country?.name ?? code;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { data?: string[]; error?: boolean };
      const cities = (data.data ?? [])
        .filter((c) => typeof c === "string" && c.trim().length > 0)
        .sort((a, b) => a.localeCompare(b));
      if (cities.length > 0) {
        return setCached(cacheKey, cities.slice(0, 500), CITY_CACHE_TTL_MS);
      }
    }
  } catch {
    // fall through to static list
  }

  const fallback = FALLBACK_CITIES[code] ?? [];
  return setCached(cacheKey, fallback, CITY_CACHE_TTL_MS);
}

export { getCountryName };
