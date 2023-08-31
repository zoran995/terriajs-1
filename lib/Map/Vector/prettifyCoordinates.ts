import { IElevation } from "./Projection";

export interface PrettifyOptions {
  elevation?: IElevation;

  /**
   * The number of digits to fix the lat / lon to.
   */
  digits?: number;
}

export interface PrettyCoordinates {
  type: "latlon";
  longitude: string;
  latitude: string;
  elevation: string | undefined;
}

export interface PrettyProjected {
  type: "projected";
  /**
   * Projection zone of the results.
   */
  zone?: string | number;
  /**
   * Coordinate in the north direction.
   */
  north: string;
  /**
   * Coordinate in the east direction.
   */
  east: string;
  /**
   * Elevation.
   */
  elevation?: string;
}

/**
 * Turns the longitude / latitude in degrees into a human readable pretty strings.
 *
 * @param longitude The longitude to format.
 * @param latitude The latitude to format.
 * @param options Options for the prettification.
 */
export default function prettifyCoordinates(
  longitude: number,
  latitude: number,
  { elevation, digits = 5 }: PrettifyOptions = {}
): PrettyCoordinates {
  const prettyLatitude =
    Math.abs(latitude).toFixed(digits) + "°" + (latitude < 0.0 ? "S" : "N");
  const prettyLongitude =
    Math.abs(longitude).toFixed(digits) + "°" + (longitude < 0.0 ? "W" : "E");

  const prettyElevation = prettifyElevation(elevation);

  return {
    latitude: prettyLatitude,
    longitude: prettyLongitude,
    elevation: prettyElevation,
    type: "latlon"
  };
}

export function prettifyElevation(elevation?: IElevation) {
  if (!elevation || !elevation.height) {
    return;
  }
  return (
    Math.round(elevation.height) +
    (elevation.errorBar !== undefined
      ? "±" + Math.round(elevation.errorBar)
      : "") +
    "m"
  );
}
