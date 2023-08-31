"use strict";

import {
  gkToLatLon,
  numberWithSpaces,
  prettifyProjectionGK
} from "../../lib/Map/Vector/Projection";

describe("prettifyCoordinates", function () {
  describe("prettifyProjectionGK", function () {
    const projectionUnits = " m";
    const point5LatLot = { lat: 45.2344, lon: 14.3534 };
    const point5projected = {
      zone: 5,
      east: 5449603.09739,
      north: 5010214.44969
    };
    const point6LatLot = { lat: 45.2344, lon: 17.3534 };
    const point6projected = {
      zone: 6,
      east: 6449634.42399,
      north: 5010200.01514
    };
    const point7LatLot = { lat: 45.2344, lon: 20.3534 };
    const point7projected = {
      zone: 7,
      east: 7449664.65265,
      north: 5010184.44052
    };
    it("function prettifyProjectionGK transforms MouseCoords coordinates from WGS84 to Gauss–Krüger zone 5", function () {
      const result = prettifyProjectionGK(point5LatLot.lon, point5LatLot.lat);
      expect(result.zone).toEqual(point5projected.zone);
      expect(result.north).toEqual(
        numberWithSpaces((<any>point5projected.north).toFixed(2)) +
          projectionUnits
      );
      expect(result.east).toEqual(
        numberWithSpaces((<any>point5projected.east).toFixed(2)) +
          projectionUnits
      );
    });

    it("function prettifyProjectionGK transforms MouseCoords coordinates from WGS84 to Gauss–Krüger zone 6", function () {
      const result = prettifyProjectionGK(point6LatLot.lon, point6LatLot.lat);
      expect(result.zone).toEqual(point6projected.zone);
      expect(result.north).toEqual(
        numberWithSpaces((<any>point6projected.north).toFixed(2)) +
          projectionUnits
      );
      expect(result.east).toEqual(
        numberWithSpaces((<any>point6projected.east).toFixed(2)) +
          projectionUnits
      );
    });

    it("function prettifyProjectionGK transforms MouseCoords coordinates from WGS84 to Gauss–Krüger zone 7", function () {
      const result = prettifyProjectionGK(point7LatLot.lon, point7LatLot.lat);
      expect(result.zone).toEqual(point7projected.zone);
      expect(result.north).toEqual(
        numberWithSpaces((<any>point7projected.north).toFixed(2)) +
          projectionUnits
      );
      expect(result.east).toEqual(
        numberWithSpaces((<any>point7projected.east).toFixed(2)) +
          projectionUnits
      );
    });
  });

  describe("gkToLatLon", function () {
    const point5LatLot = { lat: 45.2344, lon: 14.3534 };
    const point5projected = {
      zone: 5,
      east: 5449603.09739,
      north: 5010214.44969
    };
    const point6LatLot = { lat: 45.2344, lon: 17.3534 };
    const point6projected = {
      zone: 6,
      east: 6449634.42399,
      north: 5010200.01514
    };
    const point7LatLot = { lat: 45.2344, lon: 20.3534 };
    const point7projected = {
      zone: 7,
      east: 7449664.65265,
      north: 5010184.44052
    };
    it("properly converts coordinates from zone 5", function () {
      const result = gkToLatLon(point5projected.east, point5projected.north);
      expect(result.latitude.toFixed(4)).toEqual(point5LatLot.lat.toString());
      expect(result.longitude.toFixed(4)).toEqual(point5LatLot.lon.toString());
    });
    it("properly converts coordinates from zone 6", function () {
      const result = gkToLatLon(point6projected.east, point6projected.north);
      expect(result.latitude.toFixed(4)).toEqual(point6LatLot.lat.toString());
      expect(result.longitude.toFixed(4)).toEqual(point6LatLot.lon.toString());
    });
    it("properly converts coordinates from zone 7", function () {
      const result = gkToLatLon(point7projected.east, point7projected.north);
      expect(result.latitude.toFixed(4)).toEqual(point7LatLot.lat.toString());
      expect(result.longitude.toFixed(4)).toEqual(point7LatLot.lon.toString());
    });
  });
});
