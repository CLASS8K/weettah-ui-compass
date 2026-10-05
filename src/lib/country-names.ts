// Plans are synced from the supplier with ISO 3166-1 alpha-2 codes ("AE") or
// regional bundle codes ("AF-29"). Customers need real names, so convert for display only —
// slugs and stored data keep the raw code so existing URLs don't change.

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

// Shorter, more familiar names than the CLDR defaults.
const overrides: Record<string, string> = {
  AE: "United Arab Emirates",
  GB: "United Kingdom",
  US: "United States",
  HK: "Hong Kong",
  MO: "Macau",
  CD: "DR Congo",
  CG: "Congo",
  CI: "Côte d'Ivoire",
  KR: "South Korea",
  TW: "Taiwan",
};

export function countryDisplayName(code: string, region?: string): string {
  const raw = (code ?? "").trim();
  const upper = raw.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    if (overrides[upper]) return overrides[upper];
    const name = regionNames?.of(upper);
    if (name && name !== upper) return name;
    return raw;
  }
  // Regional bundles, e.g. "AF-29" → "Africa (29 countries)".
  const bundle = upper.match(/^[A-Z!]{2,3}-(\d+)$/);
  if (bundle && region) return `${region} (${bundle[1]} countries)`;
  return raw;
}
