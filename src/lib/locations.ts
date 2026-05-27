import { COUNTRIES, FALLBACK_CITIES, getCountryByCode, getCountryName } from "./countries";
import { getCached, setCached } from "./locations-cache";

const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function listCountries() {
  return COUNTRIES;
}

export async function listCitiesForCountry(countryCode: string): Promise<string[]> {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    return [];
  }

  const country = getCountryByCode(code);
  if (!country) {
    return [];
  }

  const cacheKey = `cities:${code}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const countryName = country.name;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const url = `https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(countryName)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as { data?: string[]; error?: boolean };
      const cities = (data.data ?? [])
        .filter((c) => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim())
        .sort((a, b) => a.localeCompare(b));
      if (cities.length > 0) {
        return setCached(cacheKey, cities, CITY_CACHE_TTL_MS);
      }
    }
  } catch {
    // fall through to static list
  }

  const fallback = FALLBACK_CITIES[code] ?? [];
  return setCached(cacheKey, fallback, CITY_CACHE_TTL_MS);
}

export async function searchCitiesForCountry(
  countryCode: string,
  query: string,
  limit = 10
): Promise<string[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const all = await listCitiesForCountry(countryCode);
  const startsWith: string[] = [];
  const includes: string[] = [];

  for (const city of all) {
    const lower = city.toLowerCase();
    if (lower.startsWith(q)) startsWith.push(city);
    else if (lower.includes(q)) includes.push(city);
    if (startsWith.length + includes.length >= limit * 3) break;
  }

  return [...startsWith, ...includes].slice(0, limit);
}

export { getCountryName };
