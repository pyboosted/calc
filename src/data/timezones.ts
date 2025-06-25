// UTC offset pattern
export const UTC_OFFSET_PATTERN = /^utc[+-]\d{1,2}$/;

// Common timezone names and abbreviations
export const timezones = [
  "utc",
  "gmt",
  "est",
  "edt",
  "cst",
  "cdt",
  "mst",
  "mdt",
  "pst",
  "pdt",
  "moscow",
  "yerevan",
  "london",
  "paris",
  "berlin",
  "tokyo",
  "sydney",
  "new york",
  "newyork",
  "ny",
  "nyc",
  "la",
  "los angeles",
  "losangeles",
  "chicago",
  "denver",
  "dubai",
  "singapore",
  "hong kong",
  "hongkong",
  "shanghai",
  "beijing",
  "mumbai",
  "delhi",
  "bangalore",
  "kolkata",
  "bangkok",
  "seoul",
  "istanbul",
  "cairo",
  "lagos",
  "nairobi",
  "johannesburg",
  "cape town",
  "capetown",
  "sao paulo",
  "saopaulo",
  "buenos aires",
  "buenosaires",
  "mexico",
  "mexico city",
  "mexicocity",
  "toronto",
  "vancouver",
  "montreal",
  "bst",
  "cet",
  "cest",
  "jst",
  "ist",
  "aest",
  "aedt",
];

// Multi-word timezone prefixes
export const multiWordTimezoneStarts = [
  "new",
  "los",
  "hong",
  "san",
  "cape",
  "sao",
  "buenos",
  "mexico",
];

// Helper function to check if a value is a timezone
export function isTimezone(value: string): boolean {
  const lowerValue = value.toLowerCase();

  // Check for UTC offsets
  if (UTC_OFFSET_PATTERN.test(lowerValue)) {
    return true;
  }

  // Check against known timezones
  return timezones.includes(lowerValue);
}
