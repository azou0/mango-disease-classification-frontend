/*
const CASES_URL = "";

export type NearbyCase = {
  id: string;
  disease: string;
  suburb: string;
  latitude: number;
  longitude: number;
  date: string; // ISO
  distanceKm?: number;
};

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {}

// Get cases within `radiusKm` of (lat,lng) reported in the last `days` days.
export async function getNearbyCases(
  lat: number,
  lng: number,
  radiusKm: number,
  days: number,
): Promise<NearbyCase[]> {
  const res = await fetch(CASES_URL);
  if (!res.ok) throw new Error(`Failed to load cases: ${res.status}`);
  const all: NearbyCase[] = await res.json();

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  return all
    .map((c) => ({
      ...c,
      distanceKm: distanceKm(lat, lng, c.latitude, c.longitude),
    }))
    .filter((c) => {
      const withinDistance = (c.distanceKm ?? Infinity) <= radiusKm;
      const withinTime = new Date(c.date).getTime() >= cutoff;
      return withinDistance && withinTime;
    })
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
*/
