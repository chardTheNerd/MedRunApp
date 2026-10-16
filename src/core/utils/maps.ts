/**
 * Google Maps universal directions URL. Opens the Google Maps app when it is
 * installed, otherwise falls back to the browser — works on iOS, Android,
 * and web without extra dependencies.
 */
export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}
