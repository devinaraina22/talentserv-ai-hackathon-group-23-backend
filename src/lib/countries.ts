export type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
};

/** Common countries for clinic registration — static for fast API response */
export const COUNTRIES: CountryOption[] = [
  { code: "IN", name: "India", dialCode: "+91" },
  { code: "US", name: "United States", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "AU", name: "Australia", dialCode: "+61" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "SG", name: "Singapore", dialCode: "+65" },
  { code: "DE", name: "Germany", dialCode: "+49" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "JP", name: "Japan", dialCode: "+81" },
  { code: "CN", name: "China", dialCode: "+86" },
  { code: "BR", name: "Brazil", dialCode: "+55" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "PK", name: "Pakistan", dialCode: "+92" },
  { code: "BD", name: "Bangladesh", dialCode: "+880" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94" },
  { code: "NP", name: "Nepal", dialCode: "+977" },
  { code: "MY", name: "Malaysia", dialCode: "+60" },
  { code: "PH", name: "Philippines", dialCode: "+63" },
];

export function getCountryByCode(code: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function getCountryName(code: string): string {
  return getCountryByCode(code)?.name ?? code;
}

/** Offline fallback when external city API is slow or unavailable */
export const FALLBACK_CITIES: Record<string, string[]> = {
  IN: [
    "Mumbai",
    "Pune",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ],
  US: [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "San Francisco",
    "Seattle",
    "Boston",
    "Miami",
    "Dallas",
  ],
  GB: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Edinburgh", "Liverpool"],
  CA: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"],
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  SG: ["Singapore"],
};
