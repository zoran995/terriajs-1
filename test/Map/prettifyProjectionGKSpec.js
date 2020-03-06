"use strict";

var prettifyProjectionGK = require("../../lib/Map/prettifyProjectionGK");

describe("prettifyProjectionGK", function() {
  var proj4ProjectionGK =
    "+proj=tmerc +lat_0=0 +k=0.9999 +y_0=0 +ellps=bessel +units=m +no_defs";
  var proj4longlat =
    "+proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees +no_defs";
  var projectionUnits = "m";
  var point5LatLot = { lat: 45.2344, lon: 14.3534 };
  var point5projected = { zone: 5, east: 5449603.09739, north: 5010214.44969 };
  var point6LatLot = { lat: 45.2344, lon: 17.3534 };
  var point6projected = { zone: 6, east: 6449634.42399, north: 5010200.01514 };
  var point7LatLot = { lat: 45.2344, lon: 20.3534 };
  var point7projected = { zone: 7, east: 7449664.65265, north: 5010184.44052 };

  it("function prettifyProjectionGK transforms MouseCoords coordinates from WGS84 to Gauss–Krüger zone 5", function() {
    var result = prettifyProjectionGK(
      point5LatLot.lon,
      point5LatLot.lat,
      proj4ProjectionGK,
      proj4longlat,
      projectionUnits
    );
    expect(result.zone).toEqual(point5projected.zone);
    expect(result.north).toEqual(
      point5projected.north.toFixed(2) + projectionUnits
    );
    expect(result.east).toEqual(
      point5projected.east.toFixed(2) + projectionUnits
    );
  });

  it("function prettifyProjectionGK transforms MouseCoords coordinates from WGS84 to Gauss–Krüger zone 6", function() {
    var result = prettifyProjectionGK(
      point6LatLot.lon,
      point6LatLot.lat,
      proj4ProjectionGK,
      proj4longlat,
      projectionUnits
    );
    expect(result.zone).toEqual(point6projected.zone);
    expect(result.north).toEqual(
      point6projected.north.toFixed(2) + projectionUnits
    );
    expect(result.east).toEqual(
      point6projected.east.toFixed(2) + projectionUnits
    );
  });

  it("function prettifyProjectionGK transforms MouseCoords coordinates from WGS84 to Gauss–Krüger zone 7", function() {
    var result = prettifyProjectionGK(
      point7LatLot.lon,
      point7LatLot.lat,
      proj4ProjectionGK,
      proj4longlat,
      projectionUnits
    );
    expect(result.zone).toEqual(point7projected.zone);
    expect(result.north).toEqual(
      point7projected.north.toFixed(2) + projectionUnits
    );
    expect(result.east).toEqual(
      point7projected.east.toFixed(2) + projectionUnits
    );
  });
});
