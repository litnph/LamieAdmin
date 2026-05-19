export type NominatimResult = {
  lat: number;
  lon: number;
  display_name: string;
};

export async function nominatimSearch(query: string): Promise<NominatimResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'vi',
      'User-Agent': 'LamieAdmin/1.0 (internal florist admin)',
    },
  });
  if (!res.ok) return [];
  const raw = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return raw.map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    display_name: r.display_name,
  }));
}
