import Terria from "./../../lib/Models/Terria";
import Drawing from "../../lib/Models/Drawing/Drawing";
import { DrawTypeEnum } from "../../lib/Models/Drawing/DrawType";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import { runInAction } from "mobx";
import {
  pointStyles,
  lineStyles,
  polygonStyles
} from "../../lib/Models/Drawing/DrawingUtils";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import ColorMaterialProperty from "terriajs-cesium/Source/DataSources/ColorMaterialProperty";
import ConstantProperty from "terriajs-cesium/Source/DataSources/ConstantProperty";

describe("Drawing", function () {
  let terria: Terria;
  let drawing: Drawing;

  beforeEach(function () {
    terria = new Terria();
    drawing = Drawing.getInstance(terria);
  });

  it("has a type", function () {
    expect(drawing.type).toEqual("user-draw-data");
  });

  it("properly enters draw mode", function () {
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.isDeleting).toBeFalsy();
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    expect(drawing.isDrawing).toBeTruthy();
    expect(drawing.isDeleting).toBeFalsy();
  });

  it("properly start/stop delete mode", function () {
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.isDeleting).toBeFalsy();
    drawing.startDeleteElement();
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.isDeleting).toBeTruthy();
    drawing.stopDeleting();
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.isDeleting).toBeFalsy();
  });

  it("properly handles the change between draw and delete mode", function () {
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.isDeleting).toBeFalsy();
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    expect(drawing.isDrawing).toBeTruthy();
    expect(drawing.isDeleting).toBeFalsy();
    drawing.startDeleteElement();
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.isDeleting).toBeTruthy();
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    expect(drawing.isDrawing).toBeTruthy();
    expect(drawing.isDeleting).toBeFalsy();
  });

  it("adds catalog item to workbench", function () {
    expect(drawing.terria.workbench.items.length).toEqual(0);
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    expect(drawing.terria.workbench.items.length).toEqual(1);
  });

  it("properly remove catalog item from workbench", function () {
    expect(drawing.terria.workbench.items.length).toEqual(0);
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    expect(drawing.terria.workbench.items.length).toEqual(1);
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    let pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });

    expect(drawing.pointEntities.entities.values.length).toEqual(1);
    expect(drawing.entities.entities.values.length).toEqual(1);
    drawing.onRemoveFromWorkbench();
    expect(drawing.terria.workbench.items.length).toEqual(0);
    expect(drawing.isDrawing).toBeFalsy();
    expect(drawing.pointEntities.entities.values.length).toEqual(0);
    expect(drawing.entities.entities.values.length).toEqual(0);
  });

  it("cleans up point entities when stopDrawing is called", function () {
    expect(drawing.pointEntities.entities.values.length).toEqual(0);
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    let pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });

    expect(drawing.pointEntities.entities.values.length).toEqual(1);
    drawing.stopDrawing();

    expect(drawing.pointEntities.entities.values.length).toEqual(0);
  });

  it("doesn't clean up entities when stopDrawing is called", function () {
    expect(drawing.entities.entities.values.length).toEqual(0);
    drawing.enterDrawMode(DrawTypeEnum.POINT);
    let pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    pickedFeatures.pickPosition = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });

    expect(drawing.entities.entities.values.length).toEqual(1);
    drawing.stopDrawing();

    expect(drawing.entities.entities.values.length).toEqual(1);
  });

  it("allow multiple points being draw", function () {
    expect(drawing.entities.entities.values.length).toEqual(0);
    expect(drawing.pointEntities.entities.values.length).toEqual(0);

    drawing.enterDrawMode(DrawTypeEnum.POINT);
    const pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    const x = -5088454.576893678;
    const y = 465233.10329933715;
    const z = -3804299.6786334896;

    pickedFeatures.pickPosition = new Cartesian3(x, y, z);
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    expect(drawing.pointEntities.entities.values.length).toEqual(1);
    expect(drawing.entities.entities.values.length).toEqual(1);

    // Check point
    const currentPoint = drawing.entities.entities.values[0];
    let currentPointPos = currentPoint.position!.getValue(
      terria.timelineClock.currentTime
    );
    expect(currentPointPos.x).toEqual(x);
    expect(currentPointPos.y).toEqual(y);
    expect(currentPointPos.z).toEqual(z);

    // Okay, now change points. LA.
    const newPickedFeatures = new PickedFeatures();
    const newX = -2503231.890682526;
    const newY = -4660863.528418564;
    const newZ = 3551306.84427321;
    newPickedFeatures.pickPosition = new Cartesian3(newX, newY, newZ);
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures =
        newPickedFeatures;
    });
    expect(drawing.pointEntities.entities.values.length).toEqual(2);
    expect(drawing.entities.entities.values.length).toEqual(2);
    // Check point
    const newPoint = drawing.entities.entities.values[1];
    let newPointPos = newPoint.position!.getValue(
      terria.timelineClock.currentTime
    );
    expect(newPointPos.x).toEqual(newX);
    expect(newPointPos.y).toEqual(newY);
    expect(newPointPos.z).toEqual(newZ);
  });

  it("renders proper point style", function () {
    expect(drawing.entities.entities.values.length).toEqual(0);
    expect(drawing.pointEntities.entities.values.length).toEqual(0);

    drawing.enterDrawMode(DrawTypeEnum.POINT);
    const pickedFeatures = new PickedFeatures();
    // Auckland, in case you're wondering
    const x = -5088454.576893678;
    const y = 465233.10329933715;
    const z = -3804299.6786334896;

    pickedFeatures.pickPosition = new Cartesian3(x, y, z);
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });

    // Check point
    let currentPoint = drawing.entities.entities.values[0].point!;
    expect(
      currentPoint.color!.getValue(terria.timelineClock.currentTime)
    ).toEqual(pointStyles.colorList[0].value.withAlpha(1));
    expect(
      currentPoint.pixelSize!.getValue(terria.timelineClock.currentTime)
    ).toEqual(pointStyles.pointSizes[0]);

    drawing.pointStyle = {
      color: pointStyles.colorList[2],
      opacity: 0.5,
      size: pointStyles.pointSizes[3]
    };

    // Okay, now change points. LA.
    const newPickedFeatures = new PickedFeatures();
    const newX = -2503231.890682526;
    const newY = -4660863.528418564;
    const newZ = 3551306.84427321;
    newPickedFeatures.pickPosition = new Cartesian3(newX, newY, newZ);
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures =
        newPickedFeatures;
    });

    // Check point
    currentPoint = drawing.entities.entities.values[1].point!;
    expect(
      currentPoint.color!.getValue(terria.timelineClock.currentTime)
    ).toEqual(pointStyles.colorList[2].value.withAlpha(0.5));
    expect(
      currentPoint.pixelSize!.getValue(terria.timelineClock.currentTime)
    ).toEqual(pointStyles.pointSizes[3]);
  });

  it("line proper style", function () {
    drawing.enterDrawMode(DrawTypeEnum.LINE);
    let pickedFeatures = new PickedFeatures();
    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    // Second point
    pickedFeatures = new PickedFeatures();
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    // Third point
    pickedFeatures = new PickedFeatures();
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    pickedFeatures.pickPosition = pt3CartesianPosition;
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    expect(drawing.pointEntities.entities.values.length).toEqual(3);
    expect(drawing.entities.entities.values.length).toEqual(1);
    const lineGraphics = drawing.entities.entities.values[0].polyline!;
    expect(
      lineGraphics.positions!.getValue(terria.timelineClock.currentTime).length
    ).toEqual(3);

    expect(
      lineGraphics.material.getValue(terria.timelineClock.currentTime).color
    ).toEqual(lineStyles.colorList[0].value.withAlpha(0.8));
    expect(
      lineGraphics.width!.getValue(terria.timelineClock.currentTime)
    ).toEqual(lineStyles.lineWidths[2]);
  });

  it("proper polygon style", function () {
    drawing.enterDrawMode(DrawTypeEnum.POLYGON);
    let pickedFeatures = new PickedFeatures();

    // First point
    // Points around Parliament house
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    pickedFeatures.pickPosition = pt1CartesianPosition;
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    // Second point
    pickedFeatures = new PickedFeatures();
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    pickedFeatures.pickPosition = pt2CartesianPosition;
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    // Third point
    pickedFeatures = new PickedFeatures();
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    pickedFeatures.pickPosition = pt3CartesianPosition;
    runInAction(() => {
      drawing.terria.mapInteractionModeStack[0].pickedFeatures = pickedFeatures;
    });
    expect(drawing.pointEntities.entities.values.length).toEqual(3);
    expect(drawing.entities.entities.values.length).toEqual(1);
    const polygonGraphics = drawing.entities.entities.values[0].polygon!;
    expect(
      polygonGraphics.hierarchy!.getValue(terria.timelineClock.currentTime)
        .positions.length
    ).toEqual(4);

    expect(
      (<ColorMaterialProperty>polygonGraphics.material).getValue(
        terria.timelineClock.currentTime
      ).color
    ).toEqual(polygonStyles.fillColorList[0].value.withAlpha(0.25));

    expect(
      (<ConstantProperty>(<unknown>polygonGraphics.outlineColor)).getValue(
        terria.timelineClock.currentTime
      )
    ).toEqual(polygonStyles.outlineColorList[0].value.withAlpha(0.25));

    expect(
      polygonGraphics.outlineWidth!.getValue(terria.timelineClock.currentTime)
    ).toEqual(polygonStyles.outlineWidths[2]);
  });
});
