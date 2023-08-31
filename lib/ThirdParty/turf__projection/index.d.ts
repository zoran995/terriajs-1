declare module "@turf/projection" {
  import { AllGeoJSON, Position } from "@turf/helpers";

  export function toMercator<G = AllGeoJSON | Position>(
    geojson: G,
    options?: { mutate?: boolean }
  ): G;

  export function toWgs84<G = AllGeoJSON | Position>(
    geojson: G,
    options?: { mutate?: boolean }
  ): G;
}
