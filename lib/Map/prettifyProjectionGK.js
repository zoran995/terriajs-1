"use strict";

import proj4 from "proj4/lib/index.js";

/**
 * Turns the longitude / latitude in degrees into a human readable pretty Gaus Kruger zone representation.
 */
function prettifyProjectionGK(
  longitude,
  latitude,
  proj4Projection,
  proj4longlat,
  projectionUnits
) {
  const zone = 1 + Math.floor((longitude - 1.5) / 3);
  const projection =
    proj4Projection +
    "+lon_0=" +
    zone * 3 +
    "+x_0=" +
    zone +
    "500000" +
    "+towgs84=682,-203,480,0,0,0,0";

  const projPoint = proj4(proj4longlat, projection, [longitude, latitude]);

  return {
    zone: zone,
    north: projPoint[1].toFixed(2) + projectionUnits,
    east: projPoint[0].toFixed(2) + projectionUnits
  };
}

module.exports = prettifyProjectionGK;
