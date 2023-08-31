import { runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import pollToPromise from "../../lib/Core/pollToPromise";
import supportsWebGL from "../../lib/Core/supportsWebGL";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import DrawingBase from "../../lib/Models/Drawing/DrawingBase";
import { DrawTypeEnum } from "../../lib/Models/Drawing/DrawType";
import Feature from "../../lib/Models/Feature/Feature";
import Terria from "../../lib/Models/Terria";

class Drawing extends DrawingBase {
  get type(): string {
    return "";
  }
  protected forceLoadMetadata(): Promise<void> {
    return Promise.resolve();
  }
  // just mocking abstract method
  drawHelper(): void {
    return;
  }
  getDialogMessage(): string {
    return "";
  }
  getButtonText(): string {
    return "";
  }
}

const describeIfSupported = supportsWebGL() ? describe : xdescribe;

describeIfSupported("DrawingBase that requires WebGL", function () {
  it("changes cursor to crosshair when entering drawing mode", function (done) {
    const terria = new Terria();
    const container = document.createElement("div");
    document.body.appendChild(container);
    terria.mainViewer.attach(container);

    const userDrawing = new Drawing({ terria });
    pollToPromise(() => {
      return userDrawing.terria.cesium !== undefined;
    })
      .then(() => {
        const cesium = userDrawing.terria.cesium;
        expect(cesium).toBeDefined();
        if (cesium) {
          expect(cesium.cesiumWidget.canvas.style.cursor).toEqual("");
          userDrawing.enterDrawMode(DrawTypeEnum.POINT);
          expect(cesium.cesiumWidget.canvas.style.cursor).toEqual("crosshair");
          userDrawing.stopDrawing();
          expect(cesium.cesiumWidget.canvas.style.cursor).toEqual("auto");
        }
      })
      .then(done)
      .catch(done.fail);
  });
});

describe("DrawingBase", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria();
  });

  describe("Draw mode point", function () {
    let userDrawing: Drawing;
    let drawMode: DrawTypeEnum = DrawTypeEnum.POINT;

    beforeEach(function () {
      const options = { terria: terria, shouldRemovePoint: true };
      userDrawing = new Drawing(options);
    });
    it("listens for user picks on map after entering drawing mode", function () {
      userDrawing.enterDrawMode(drawMode);
      expect(userDrawing.terria.mapInteractionModeStack.length).toEqual(1);
    });

    it("ensures correct draw mode", function () {
      userDrawing.enterDrawMode(drawMode);
      expect(userDrawing.currentDrawingMode).toEqual(DrawTypeEnum.POINT);
    });
    it("ensure draw mode is not change in middle of draw", function () {
      userDrawing.enterDrawMode(DrawTypeEnum.POINT);
      userDrawing.enterDrawMode(DrawTypeEnum.LINE);
      expect(userDrawing.currentDrawingMode).toEqual(DrawTypeEnum.POINT);
    });

    it("disables feature info requests when in drawing mode", function () {
      expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(true);
      userDrawing.enterDrawMode(drawMode);
      expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(false);
    });

    it("re-enables feature info requests on stopDrawing", function () {
      userDrawing.enterDrawMode(drawMode);
      expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(false);
      userDrawing.stopDrawing();
      expect(userDrawing.terria.allowFeatureInfoRequests).toEqual(true);
    });

    it("ensures onPointClicked callback is called when point is picked by user", function () {
      const onPointClicked = jasmine.createSpy();
      const userDrawing = new Drawing({ terria, onPointClicked });
      userDrawing.enterDrawMode(drawMode);
      const pickedFeatures = new PickedFeatures();
      // Auckland, in case you're wondering
      pickedFeatures.pickPosition = new Cartesian3(
        -5088454.576893678,
        465233.10329933715,
        -3804299.6786334896
      );
      runInAction(() => {
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });
      const pointEntities = onPointClicked.calls.mostRecent().args[0];
      expect(pointEntities.entities.values.length).toEqual(1);
    });

    it("ensures graphics are added when point is picked by user", async function () {
      expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
      expect(userDrawing.entities.entities.values.length).toEqual(0);
      userDrawing.enterDrawMode(drawMode);
      const pickedFeatures = new PickedFeatures();
      // Auckland, in case you're wondering
      pickedFeatures.pickPosition = new Cartesian3(
        -5088454.576893678,
        465233.10329933715,
        -3804299.6786334896
      );
      runInAction(() => {
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });
      expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
      expect(userDrawing.entities.entities.values.length).toEqual(1);
    });

    it("ensures graphics are updated when points change", function () {
      expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
      expect(userDrawing.entities.entities.values.length).toEqual(0);

      userDrawing.enterDrawMode(drawMode);
      const pickedFeatures = new PickedFeatures();
      // Auckland, in case you're wondering
      const x = -5088454.576893678;
      const y = 465233.10329933715;
      const z = -3804299.6786334896;

      pickedFeatures.pickPosition = new Cartesian3(x, y, z);
      runInAction(() => {
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });

      // Check point
      const currentPoint = userDrawing.pointEntities.entities.values[0];
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          newPickedFeatures;
      });

      // Check point
      const newPoint = userDrawing.pointEntities.entities.values[1];
      let newPointPos = newPoint.position!.getValue(
        terria.timelineClock.currentTime
      );
      expect(newPointPos.x).toEqual(newX);
      expect(newPointPos.y).toEqual(newY);
      expect(newPointPos.z).toEqual(newZ);
    });

    it("ensures onCleanUp callback is called when stop drawing occurs", function () {
      const onCleanUp = jasmine.createSpy();
      const userDrawing = new Drawing({ terria, onCleanUp });
      userDrawing.enterDrawMode(drawMode);
      expect(onCleanUp).not.toHaveBeenCalled();
      userDrawing.stopDrawing();
      expect(onCleanUp).toHaveBeenCalled();
    });

    it("function clickedExistingPoint detects and handles if existing point is clicked", function () {
      userDrawing.enterDrawMode(drawMode);
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });

      // Now pick the first point
      pickedFeatures = new PickedFeatures();
      pickedFeatures.pickPosition = pt1CartesianPosition;
      // If in the UI the user clicks on a point, it returns that entity, so we're pulling it out of userDrawing and
      // pretending the user actually clicked on it.
      const pt1Entity = userDrawing.pointEntities.entities.values[0];
      pickedFeatures.features = [
        Feature.fromEntityCollectionOrEntity(pt1Entity)
      ];
      runInAction(() => {
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });

      expect(userDrawing.pointEntities.entities.values.length).toEqual(2);
    });
  });

  describe("Draw mode line", function () {
    let userDrawing: Drawing;
    let drawMode: DrawTypeEnum = DrawTypeEnum.LINE;

    beforeEach(function () {
      const options = { terria: terria };
      userDrawing = new Drawing(options);
    });

    it("ensures correct draw mode", function () {
      userDrawing.enterDrawMode(drawMode);
      expect(userDrawing.currentDrawingMode).toEqual(DrawTypeEnum.LINE);
    });

    it("ensures graphics for line is correctly created", async function () {
      userDrawing.enterDrawMode(drawMode);
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });
      expect(userDrawing.pointEntities.entities.values.length).toEqual(3);
      expect(userDrawing.entities.entities.values.length).toEqual(1);
      expect(
        userDrawing.entities.entities.values[0].polyline!.positions!.getValue(
          terria.timelineClock.currentTime
        ).length
      ).toEqual(3);
    });
  });

  describe("Draw mode polygon", function () {
    let userDrawing: Drawing;
    let drawMode: DrawTypeEnum = DrawTypeEnum.POLYGON;

    beforeEach(function () {
      const options = { terria: terria };
      userDrawing = new Drawing(options);
    });

    it("ensures correct draw mode", function () {
      userDrawing.enterDrawMode(drawMode);
      expect(userDrawing.currentDrawingMode).toEqual(DrawTypeEnum.POLYGON);
    });

    it("ensures graphics for polygon is correctly created", async function () {
      userDrawing.enterDrawMode(drawMode);
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
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
        userDrawing.terria.mapInteractionModeStack[0].pickedFeatures =
          pickedFeatures;
      });
      expect(userDrawing.pointEntities.entities.values.length).toEqual(3);
      expect(userDrawing.entities.entities.values.length).toEqual(1);
      expect(
        userDrawing.entities.entities.values[0].polygon!.hierarchy!.getValue(
          terria.timelineClock.currentTime
        ).positions.length
      ).toEqual(3);
    });
  });
});
