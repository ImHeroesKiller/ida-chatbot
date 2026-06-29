export interface MapGeocodeResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface MapGeocodeResponse {
  results: MapGeocodeResult[];
}