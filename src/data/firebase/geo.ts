import { distanceBetween, geohashForLocation, geohashQueryBounds } from 'geofire-common';
import { GeoCoordinate, GeoIndexedLocation } from '../../core/types/geo';

export function toGeoIndexed(coord: GeoCoordinate): GeoIndexedLocation {
  return {
    ...coord,
    geohash: geohashForLocation([coord.latitude, coord.longitude]),
  };
}

export function geoQueryBounds(center: GeoCoordinate, radiusKm: number) {
  return geohashQueryBounds([center.latitude, center.longitude], radiusKm * 1000);
}

export function distanceKm(a: GeoCoordinate, b: GeoCoordinate): number {
  return distanceBetween([a.latitude, a.longitude], [b.latitude, b.longitude]);
}
