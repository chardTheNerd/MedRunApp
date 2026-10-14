import { GeoCoordinate } from '../../core/types/geo'; 

function rad(d: number): number {
  return (d * Math.PI) / 180;
}

export function distanceKm(a: GeoCoordinate, b: GeoCoordinate): number {
  const h =
    Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
