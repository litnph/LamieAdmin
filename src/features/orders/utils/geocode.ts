export type NominatimResult = {
  lat: number;
  lon: number;
  display_name: string;
};

export async function nominatimSearch(query: string, signal?: AbortSignal): Promise<NominatimResult[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'vn',
    addressdetails: '1',
    q,
  });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'vi',
    },
  });
  if (!res.ok) throw new Error('Dịch vụ tìm địa chỉ đang bận. Vui lòng thử lại.');
  const raw = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return raw
    .map((r) => ({ lat: Number(r.lat), lon: Number(r.lon), display_name: r.display_name }))
    .filter((result) => Number.isFinite(result.lat) && Number.isFinite(result.lon));
}

export async function nominatimReverse(latitude: number, longitude: number, signal?: AbortSignal): Promise<string | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'vi',
    },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Không thể tải địa chỉ tại vị trí đã ghim.');
  const result = (await response.json()) as { display_name?: string };
  return result.display_name?.trim() || null;
}
