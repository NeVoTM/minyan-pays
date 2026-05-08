/** Free address geocoding via OpenStreetMap Nominatim. We obey the 1-req/sec policy via short-lived cache + sequential calls. */

type GeocodeResult = {
  latitude: number;
  longitude: number;
  source: "nominatim";
  displayName: string;
};

const CACHE = new Map<string, { value: GeocodeResult | null; at: number }>();
const TTL_MS = 6 * 60 * 60 * 1000;
let lastCallAt = 0;
const MIN_GAP_MS = 1100;

function normalizeQuery(parts: { address?: string | null; city?: string | null; state?: string | null; postalCode?: string | null }): string {
  const pieces = [parts.address, parts.city, parts.state, parts.postalCode]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  return pieces.join(", ");
}

async function nominatim(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const wait = Math.max(0, MIN_GAP_MS - (Date.now() - lastCallAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(url.toString(), {
      signal: ac.signal,
      headers: {
        "User-Agent": "minyanpays/1.0 (https://minyanpays.com; contact@minyanpays.com)",
        "Accept-Language": "en",
      },
    });
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;
    const first = arr[0];
    if (!first) return null;
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      latitude: lat,
      longitude: lon,
      source: "nominatim",
      displayName: first.display_name ?? query,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeAddress(parts: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}): Promise<GeocodeResult | null> {
  const query = normalizeQuery(parts);
  if (!query) return null;
  const key = query.toLowerCase();
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const value = await nominatim(query);
  CACHE.set(key, { value, at: Date.now() });
  return value;
}
