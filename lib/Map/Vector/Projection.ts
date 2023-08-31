import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";

import LatLonHeight from "../../Core/LatLonHeight";
import prettifyCoordinates, {
  PrettifyOptions,
  PrettyCoordinates,
  PrettyProjected,
  prettifyElevation
} from "./prettifyCoordinates";

const proj4 = require("proj4/lib/index.js").default;

export type ProjectionType = "latlon" | "projected";

const PROJ4_LONG_LAT =
  "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs";

export interface ProjectionParams {
  type: ProjectionType;
  /**
   * Unique identificator of projection.
   */
  id: string;
  /**
   * Name of the projection that will be shown to the user. Best to use EPSG code.
   */
  name: string;

  /**
   * Definition of projection using proj4 notation.
   */
  proj4?: string;
  /**
   * Measurement units of projection, default `m`.
   */
  projectionUnits?: string;
  /**
   * The name of the first axis (short name), default `E`.
   */
  firstAxisName?: string;
  /**
   * The full name of first axis, fallback to short name.
   */
  firstAxisNameFull?: string;
  /**
   * The name to use for north axis, default `N`.
   */
  secondAxisName?: string;
  /**
   * The full name of seconde axis, fallback to short name.
   */
  secondAxisNameFull?: string;
  /**
   * Wheter to use this projection in search tool.
   */
  useInSearch?: boolean;
  /**
   * Wheter to use this projection in location bar.
   */
  useInLocationBar?: boolean;
}

export interface IElevation {
  height: number;
  errorBar?: number;
}

export class Projection {
  constructor(readonly params: ProjectionParams) {
    this.params = params;
  }

  public project(coordinates: Cartographic, elevation?: IElevation) {
    const latLon = cartographicToLatLon(coordinates);

    return generalPrettify(latLon.longitude, latLon.latitude, { elevation });
  }

  public toLatLon(east: number, north: number) {
    return generalToLatLon(east, north, this.params.proj4);
  }
}

export class ProjectionUTM extends Projection {
  constructor() {
    super({
      type: "projected",
      id: "utm",
      name: "UTM",
      firstAxisName: "translate#coordinateSearch.utm.firstAxisName",
      firstAxisNameFull: "translate#coordinateSearch.utm.firstAxisNameFull",
      secondAxisName: "translate#coordinateSearch.utm.secondAxisName",
      secondAxisNameFull: "translate#coordinateSearch.utm.secondAxisNameFull",
      useInSearch: false,
      useInLocationBar: true
    });
  }

  public project(coordinates: Cartographic, elevation?: IElevation) {
    const latLon = cartographicToLatLon(coordinates);
    return prettifyProjectionUTM(latLon.longitude, latLon.latitude, elevation);
  }
}

export class ProjectionGK extends Projection {
  constructor() {
    super({
      type: "projected",
      id: "gk",
      name: "Gaus-Krueger",
      firstAxisName: "Y",
      secondAxisName: "X",
      useInSearch: true,
      useInLocationBar: true
    });
  }

  public project(coordinates: Cartographic, elevation?: IElevation) {
    const latLon = cartographicToLatLon(coordinates);
    return prettifyProjectionGK(latLon.longitude, latLon.latitude);
  }

  public toLatLon(east: number, north: number): LatLonHeight {
    return gkToLatLon(east, north);
  }
}

export class ProjectionLatLon extends Projection {
  constructor() {
    super({
      type: "latlon",
      id: "wgs84",
      name: "WGS 84",
      firstAxisName: "translate#coordinateSearch.wgs84.firstAxisName",
      firstAxisNameFull: "translate#coordinateSearch.wgs84.firstAxisNameFull",
      secondAxisName: "translate#coordinateSearch.wgs84.secondAxisName",
      secondAxisNameFull: "translate#coordinateSearch.wgs84.secondAxisNameFull",
      useInSearch: true,
      useInLocationBar: true
    });
  }

  public toLatLon(east: number, north: number): LatLonHeight {
    return {
      latitude: east,
      longitude: north
    };
  }
}

export const defaultProjections: Projection[] = [
  new ProjectionLatLon(),
  new ProjectionUTM(),
  new ProjectionGK()
];

export const generalPrettify = (
  longitude: number,
  latitude: number,
  options: PrettifyOptions = {},
  type?: ProjectionType,
  projDefinition?: string,
  projectionUnits?: string
): PrettyProjected | PrettyCoordinates => {
  if (!projDefinition) {
    return prettifyCoordinates(longitude, latitude, options);
  }

  const projPoint = proj4(PROJ4_LONG_LAT, projDefinition, [
    longitude,
    latitude
  ]);

  if (!projPoint) {
    return prettifyCoordinates(longitude, latitude, options);
  }

  if (type === "latlon") {
    return prettifyCoordinates(
      projPoint[0].toFixed(2),
      projPoint[1].toFixed(2),
      options
    );
  } else {
    const prettyElevation = prettifyElevation(options.elevation);

    return {
      north: `${numberWithSpaces(projPoint[1].toFixed(2))} ${
        projectionUnits || "m"
      }`,
      east: `${numberWithSpaces(projPoint[0].toFixed(2))} ${
        projectionUnits || "m"
      }`,
      elevation: prettyElevation,
      type: "projected"
    };
  }
};

export function generalToLatLon(
  east: number,
  north: number,
  projDefinition?: string
): LatLonHeight {
  const projPoint = proj4(projDefinition, PROJ4_LONG_LAT, [east, north]);
  return {
    latitude: projPoint[1],
    longitude: projPoint[0]
  };
}

export function numberWithSpaces(x: number) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join(".");
}

/**
 * Turns the longitude / latitude in degrees into a human readable pretty UTM zone representation.
 */
export function prettifyProjectionUTM(
  longitude: number,
  latitude: number,
  elevation?: IElevation
): PrettyProjected {
  const zone = 1 + Math.floor((longitude + 180) / 6);

  const projection =
    "+proj=utm +ellps=GRS80 +units=m +no_defs +zone=" +
    zone +
    (latitude < 0 ? " +south" : "");

  const projPoint = proj4(PROJ4_LONG_LAT, projection, [longitude, latitude]);

  const prettyElevation = prettifyElevation(elevation);

  return {
    zone: zone + (latitude < 0.0 ? "S" : "N"),
    north: `${numberWithSpaces(projPoint[1].toFixed(2))} m`,
    east: `${numberWithSpaces(projPoint[0].toFixed(2))} m`,
    elevation: prettyElevation,
    type: "projected"
  };
}

/**
 * Turns the longitude / latitude in degrees into a human readable pretty Gaus-Krueger zone representation.
 */
export function prettifyProjectionGK(
  longitude: number,
  latitude: number,
  elevation?: IElevation
): PrettyProjected {
  const zone = 1 + Math.floor((longitude - 1.5) / 3);

  const projection =
    "+proj=tmerc +lat_0=0 +k=0.9999 +y_0=0 +ellps=bessel +units=m +no_defs" +
    "+lon_0=" +
    zone * 3 +
    "+x_0=" +
    zone +
    "500000" +
    "+y_0=" +
    (latitude > 0 ? "0" : "10000000") +
    "+towgs84=682,-203,480,0,0,0,0";
  const projPoint = proj4(PROJ4_LONG_LAT, projection, [longitude, latitude]);

  const prettyElevation = prettifyElevation(elevation);

  return {
    zone: zone,
    north: `${numberWithSpaces(projPoint[1].toFixed(2))} m`,
    east: `${numberWithSpaces(projPoint[0].toFixed(2))} m`,
    elevation: prettyElevation,
    type: "projected"
  };
}

export function gkToLatLon(y: number, x: number): LatLonHeight {
  const zone = parseInt(y.toString().substring(0, 1));

  const projection =
    "+proj=tmerc +lat_0=0 +k=0.9999 +y_0=0 +ellps=bessel +units=m +no_defs" +
    "+lon_0=" +
    zone * 3 +
    "+x_0=" +
    zone +
    "500000" +
    "+y_0=" +
    0 +
    "+towgs84=682,-203,480,0,0,0,0";

  return generalToLatLon(y, x, projection);
}

export const cartographicToLatLon = (coordinates: Cartographic) => {
  const latitude = CesiumMath.toDegrees(coordinates.latitude);
  const longitude = CesiumMath.toDegrees(coordinates.longitude);

  return {
    latitude,
    longitude
  };
};
