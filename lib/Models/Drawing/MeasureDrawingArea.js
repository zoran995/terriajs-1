import EllipsoidTangentPlane from "terriajs-cesium/Source/Core/EllipsoidTangentPlane";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import VertexFormat from "terriajs-cesium/Source/Core/VertexFormat";
import PolygonGeometryLibrary from "terriajs-cesium/Source/Core/PolygonGeometryLibrary";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";

const updateArea = function (pointEntities, terria) {
  let result = 0;
  if (pointEntities.entities.values.length < 3) {
    return 0;
  }

  const perPositionHeight = true;

  const positions = [];
  for (let i = 0; i < pointEntities.entities.values.length; i++) {
    const currentPoint = pointEntities.entities.values[i];
    const currentPointPos = currentPoint.position.getValue(
      terria.timelineClock.currentTime
    );
    positions.push(currentPointPos);
  }

  // Request the triangles that make up the polygon from Cesium.
  const tangentPlane = EllipsoidTangentPlane.fromPoints(
    positions,
    Ellipsoid.WGS84
  );
  const polygons = PolygonGeometryLibrary.polygonsFromHierarchy(
    new PolygonHierarchy(positions),
    tangentPlane.projectPointsOntoPlane.bind(tangentPlane),
    !perPositionHeight,
    Ellipsoid.WGS84
  );

  const geom = PolygonGeometryLibrary.createGeometryFromPositions(
    Ellipsoid.WGS84,
    polygons.polygons[0],
    CesiumMath.RADIANS_PER_DEGREE,
    perPositionHeight,
    VertexFormat.POSITION_ONLY
  );
  if (
    geom.indices.length % 3 !== 0 ||
    geom.attributes.position.values.length % 3 !== 0
  ) {
    // Something has gone wrong. We expect triangles. Can't calcuate area.
    return result;
  }

  const coords = [];
  for (let i = 0; i < geom.attributes.position.values.length; i += 3) {
    coords.push(
      new Cartesian3(
        geom.attributes.position.values[i],
        geom.attributes.position.values[i + 1],
        geom.attributes.position.values[i + 2]
      )
    );
  }
  for (let i = 0; i < geom.indices.length; i += 3) {
    const ind1 = geom.indices[i];
    const ind2 = geom.indices[i + 1];
    const ind3 = geom.indices[i + 2];

    const a = Cartesian3.distance(coords[ind1], coords[ind2]);
    const b = Cartesian3.distance(coords[ind2], coords[ind3]);
    const c = Cartesian3.distance(coords[ind3], coords[ind1]);

    // Heron's formula
    const s = (a + b + c) / 2.0;
    result += Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }
  return result;
};

export default updateArea;
