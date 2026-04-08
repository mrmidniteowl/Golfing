export interface NearbyPlace {
  name: string
  lat: number
  lng: number
  distance: number
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    })
  })
}

/**
 * Search for nearby golf courses using OpenStreetMap Overpass API (free, no key needed)
 */
export async function findNearbyCourses(lat: number, lng: number, radiusMeters = 10000): Promise<NearbyPlace[]> {
  const query = `
    [out:json][timeout:10];
    (
      way["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
      relation["leisure"="golf_course"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;
  `
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

  const res = await fetch(url)
  if (!res.ok) return []

  const data = await res.json()

  return data.elements
    .filter((el: Record<string, unknown>) => {
      const tags = el.tags as Record<string, string> | undefined
      return tags?.name
    })
    .map((el: Record<string, unknown>) => {
      const tags = el.tags as Record<string, string>
      const center = el.center as { lat: number; lon: number } | undefined
      const elLat = center?.lat ?? (el.lat as number)
      const elLng = center?.lon ?? (el.lon as number)
      return {
        name: tags.name,
        lat: elLat,
        lng: elLng,
        distance: haversine(lat, lng, elLat, elLng),
      }
    })
    .sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance)
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
