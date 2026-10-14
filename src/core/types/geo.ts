export type GeoCoordinate = {
  latitude: number;
  longitude: number;
};

export type GeoIndexedLocation = GeoCoordinate & {
  geohash: string;
};
