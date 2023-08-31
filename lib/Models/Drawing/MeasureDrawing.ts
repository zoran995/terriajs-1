import i18next from "i18next";
import { action, makeObservable } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import EllipsoidGeodesic from "terriajs-cesium/Source/Core/EllipsoidGeodesic";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import DrawingBase, { DrawingBaseOptions } from "./DrawingBase";
import { DrawTypeEnum } from "./DrawType";
/* import EllipsoidTangentPlane from "terriajs-cesium/Source/Core/EllipsoidTangentPlane";
import PolygonHierarchy from "terriajs-cesium/Source/Core/PolygonHierarchy";
import VertexFormat from "terriajs-cesium/Source/Core/VertexFormat";
import PolygonGeometryLibrary from "terriajs-cesium/Source/Core/PolygonGeometryLibrary";
import CesiumMath from "terriajs-cesium/Source/Core/Math"; */

export default class MeasureDrawing extends DrawingBase {
  constructor(options: DrawingBaseOptions) {
    super(options);
    makeObservable(this);
  }

  enterDrawMode(drawMode: DrawTypeEnum): void {
    this.terria.overlays.add(this);
    super.enterDrawMode(drawMode);
  }

  drawHelper() {
    const onRightClick = this.onRightClick;
    if (this.terria.leaflet) {
      this.terria.leaflet?.map.on("contextmenu", onRightClick, this);
    } else if (this.terria.cesium) {
      const handler = new ScreenSpaceEventHandler(
        this.terria.cesium.scene.canvas
      );
      handler.setInputAction(function (e) {
        onRightClick(e);
      }, ScreenSpaceEventType.RIGHT_CLICK);
    }
  }

  @action
  protected addTempPoint(position: Cartesian3): void {
    if (this.currentDrawingMode === DrawTypeEnum.POINT) {
      this.entities.entities.removeAll();
      this.pointEntities.entities.removeAll();
    }
    super.addTempPoint(position);
  }

  @action.bound
  onRightClick(e: any) {
    if (e.originalEvent && e.originalEvent.preventDefault) {
      e.originalEvent.preventDefault();
    }

    if (this.drawingMode !== DrawTypeEnum.POINT) {
      this.startAgain();
    }
  }

  startAgain() {
    this.pointEntities.entities.removeAll();
    if (typeof this.onCleanUp === "function") {
      this.onCleanUp();
    }
    this.tooltipMessage = this.getTooltipMessage();
  }

  stopDrawing() {
    this.pointEntities.entities.removeAll();
    this.entities.entities.removeAll();
    super.stopDrawing();
  }

  protected getTooltipMessage() {
    if (this.drawingMode === DrawTypeEnum.POINT) {
      return "translate#measureTool.clickToMeasureCoordinate";
    } else if (this.pointEntities.entities.values.length === 0) {
      return "translate#measureTool.clickToAddFirstPoint";
    } else {
      return "translate#measureTool.clickToAddAnotherPoint";
    }
  }

  @action
  updateDistance(pointEntities: CustomDataSource): number {
    let result = 0;
    if (pointEntities.entities.values.length < 1) {
      return 0;
    }

    const prevPoint = pointEntities.entities.values[0];
    let prevPointPos = prevPoint.position!.getValue(
      this.terria.timelineClock.currentTime
    );
    for (let i = 1; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position!.getValue(
        this.terria.timelineClock.currentTime
      );

      result = result + this.getGeodesicDistance(prevPointPos, currentPointPos);

      prevPointPos = currentPointPos;
    }
    return result;
  }

  /*   @action
  updateArea(pointEntities: CustomDataSource): number {
    let result = 0;
    if (pointEntities.entities.values.length < 3) {
      return 0;
    }

    const perPositionHeight = true;

    const positions = [];
    for (let i = 0; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position.getValue(
        this.terria.timelineClock.currentTime
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
  }
 */
  getGeodesicDistance(pointOne: Cartesian3, pointTwo: Cartesian3) {
    // Note that Cartesian.distance gives the straight line distance between the two points, ignoring
    // curvature. This is not what we want.
    const pickedPointCartographic =
      Ellipsoid.WGS84.cartesianToCartographic(pointOne);
    const lastPointCartographic =
      Ellipsoid.WGS84.cartesianToCartographic(pointTwo);
    const geodesic = new EllipsoidGeodesic(
      pickedPointCartographic,
      lastPointCartographic
    );
    return geodesic.surfaceDistance;
  }

  @action
  updateCoordinate(pointEntities: CustomDataSource): Cartesian3 {
    const point = pointEntities.entities.values[0];
    const position = point.position!.getValue(
      this.terria.timelineClock.currentTime
    );
    return position;
  }

  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
}
