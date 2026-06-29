export function formatMapCoordinates(
  lat: number,
  lng: number,
  precision = 5,
): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/** Higher precision string for clipboard / research citations. */
export function formatMapCoordinatesForCopy(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function formatMapCoordinatesWithLabel(
  label: string | undefined,
  lat: number,
  lng: number,
): string {
  const coords = formatMapCoordinatesForCopy(lat, lng);
  return label?.trim() ? `${label.trim()} (${coords})` : coords;
}