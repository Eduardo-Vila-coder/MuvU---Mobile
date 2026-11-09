import type { Coordinates } from '../types/location';
import type { University } from '../types/university';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Haversine formula: straight-line distance between two points on Earth
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Used with the GPS: which university is closest to where the user is
export function findNearestUniversity(origin: Coordinates, universities: University[]) {
  let nearest: { university: University; distance: number } | null = null;

  for (const university of universities) {
    const distance = distanceKm(origin, { latitude: university.latitud, longitude: university.longitud });
    if (!nearest || distance < nearest.distance) nearest = { university, distance };
  }
  return nearest;
}