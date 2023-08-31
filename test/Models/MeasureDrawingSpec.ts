import Terria from "../../lib/Models/Terria";
import MeasureDrawing from "./../../lib/Models/Drawing/MeasureDrawing";
import { runInAction } from "mobx";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import PickedFeatures from "../../lib/Map/PickedFeatures/PickedFeatures";
import { DrawTypeEnum } from "../../lib/Models/Drawing/DrawType";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import updateArea from "../../lib/Models/Drawing/MeasureDrawingArea";

describe("MeasureDrawing ", function () {
  let terria: Terria;
  let userDrawing: MeasureDrawing;

  beforeEach(function () {
    terria = new Terria();
    const options = { terria: terria };
    userDrawing = new MeasureDrawing(options);
  });

  it("returns correct button text for any given number of points on map", function () {
    expect(userDrawing.getButtonText()).toEqual("models.userDrawing.btnCancel");
    userDrawing.pointEntities.entities.values.push(new Entity());
    expect(userDrawing.getButtonText()).toEqual("models.userDrawing.btnCancel");
    userDrawing.pointEntities.entities.values.push(new Entity());
    expect(userDrawing.getButtonText()).toEqual("models.userDrawing.btnDone");
  });

  it("cleans up when stopDrawing is called", function () {
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.entities.entities.values.length).toEqual(0);
    userDrawing.enterDrawMode(DrawTypeEnum.POINT);

    let pickedFeatures = new PickedFeatures();
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

    userDrawing.stopDrawing();
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.entities.entities.values.length).toEqual(0);
    expect(userDrawing.isDrawing).toBeFalsy();
  });

  it("allows only one point beeing draw", function () {
    expect(userDrawing.pointEntities.entities.values.length).toEqual(0);
    expect(userDrawing.entities.entities.values.length).toEqual(0);

    userDrawing.enterDrawMode(DrawTypeEnum.POINT);
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
    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
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
    expect(userDrawing.pointEntities.entities.values.length).toEqual(1);
    // Check point
    const newPoint = userDrawing.pointEntities.entities.values[0];
    let newPointPos = newPoint.position!.getValue(
      terria.timelineClock.currentTime
    );
    expect(newPointPos.x).toEqual(newX);
    expect(newPointPos.y).toEqual(newY);
    expect(newPointPos.z).toEqual(newZ);
  });

  it("measures geodesic distance in 3D mode", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.LINE);
    // Roughly Auckland
    const positionOne = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );

    // Roughly L.A.
    const positionTwo = new Cartesian3(
      -2503231.890682526,
      -4660863.528418564,
      3551306.84427321
    );

    const distance_m = userDrawing.getGeodesicDistance(
      positionOne,
      positionTwo
    );
    // This is a golden distance test, but the actual distance from LA to Auckland is roughly 10,494.93 km, so
    // close.
    expect(Math.abs(distance_m - 10476961.667267017) < 2e-9).toBeTruthy();
  });

  it("measures geodesic distance in 2D mode", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.LINE);
    // Roughly Auckland
    const positionOne = new Cartesian3(
      -5088454.576893678,
      465233.10329933715,
      -3804299.6786334896
    );

    // Roughly L.A.
    const positionTwo = new Cartesian3(
      -2503231.890682526,
      -4660863.528418564,
      3551306.84427321
    );

    const distance_m = userDrawing.getGeodesicDistance(
      positionOne,
      positionTwo
    );
    // This is a golden distance test, but the actual distance from LA to Auckland is roughly 10,494.93 km, so
    // close.
    expect(Math.abs(distance_m - 10476961.667267017) < 2e-9).toBeTruthy();
  });

  it("measures distance accurately", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.LINE);
    // And by accurately, I mean similar to google maps. Points are visually distinguishable points on parliament
    // house.
    const pointEntities = new CustomDataSource();
    pointEntities.entities.add(
      new Entity({
        name: "Parl house 1",
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472628.878459197,
            2674320.0223987163,
            -3666272.9589235038
          )
        )
      })
    );

    pointEntities.entities.add(
      new Entity({
        name: "Parl house 2",
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472822.49209372,
            2674246.213307502,
            -3666094.8052623854
          )
        )
      })
    );

    expect(userDrawing.updateDistance(pointEntities).toFixed(2)).toEqual(
      "273.23"
    );
  });

  it("measures distance accurately with geoscience australia test", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.LINE);
    const pointEntities = new CustomDataSource();

    const flindersPeakPosition = new Cartographic(
      CesiumMath.toRadians(144.424868),
      CesiumMath.toRadians(-37.951033),
      CesiumMath.toRadians(0)
    );
    const flindersPeakCartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(flindersPeakPosition);
    const buninyongPosition = new Cartographic(
      CesiumMath.toRadians(143.926496),
      CesiumMath.toRadians(-37.652821),
      CesiumMath.toRadians(0)
    );
    const buninyongCartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(buninyongPosition);

    pointEntities.entities.add(
      new Entity({
        name: "Flinder's Peak",
        position: new ConstantPositionProperty(flindersPeakCartesianPosition)
      })
    );

    pointEntities.entities.add(
      new Entity({
        name: "Buninyong",
        position: new ConstantPositionProperty(buninyongCartesianPosition)
      })
    );

    expect(
      (userDrawing.updateDistance(pointEntities) / 1000).toFixed(2)
    ).toEqual("54.97");
  });

  it("measures distance accurately with more points", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.LINE);

    // And by accurately, I mean similar to google maps. Points are visually distinguishable points on parliament
    // house. This is roughly the same distance as 'measures distance accurately' but has more points.
    const pointEntities = new CustomDataSource();
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472821.5616301615,
            2674248.078411612,
            -3666094.813749141
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472782.699102473,
            2674262.986482508,
            -3666130.2532728123
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472753.492698317,
            2674274.3463433487,
            -3666156.7158062747
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472723.915450494,
            2674288.96271715,
            -3666190.6009734552
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472684.617701235,
            2674304.5195146934,
            -3666229.3233881197
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472628.62862585,
            2674320.1352525284,
            -3666273.2152227913
          )
        )
      })
    );

    expect(userDrawing.updateDistance(pointEntities).toFixed(2)).toEqual(
      "272.46"
    );
  });

  it("updates distance when a point is removed", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.LINE);

    const pointEntities = new CustomDataSource();
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472821.5616301615,
            2674248.078411612,
            -3666094.813749141
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472782.699102473,
            2674262.986482508,
            -3666130.2532728123
          )
        )
      })
    );
    pointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472628.62862585,
            2674320.1352525284,
            -3666273.2152227913
          )
        )
      })
    );

    expect(userDrawing.updateDistance(pointEntities).toFixed(2)).toEqual(
      "272.45"
    );

    const newPointEntities = new CustomDataSource();
    newPointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472821.5616301615,
            2674248.078411612,
            -3666094.813749141
          )
        )
      })
    );
    newPointEntities.entities.add(
      new Entity({
        position: new ConstantPositionProperty(
          new Cartesian3(
            -4472782.699102473,
            2674262.986482508,
            -3666130.2532728123
          )
        )
      })
    );

    expect(userDrawing.updateDistance(newPointEntities).toFixed(2)).toEqual(
      "54.66"
    );
  });

  it("measures area correctly compared to hand-calculated area", function () {
    userDrawing.enterDrawMode(DrawTypeEnum.POLYGON);

    const pointEntities = new CustomDataSource();
    const pt1Position = new Cartographic(
      CesiumMath.toRadians(149.121),
      CesiumMath.toRadians(-35.309),
      CesiumMath.toRadians(0)
    );
    const pt1CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt1Position);
    const pt2Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.311),
      CesiumMath.toRadians(0)
    );
    const pt2CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt2Position);
    const pt3Position = new Cartographic(
      CesiumMath.toRadians(149.127),
      CesiumMath.toRadians(-35.308),
      CesiumMath.toRadians(0)
    );
    const pt3CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt3Position);
    const pt4Position = new Cartographic(
      CesiumMath.toRadians(149.124),
      CesiumMath.toRadians(-35.306),
      CesiumMath.toRadians(0)
    );
    const pt4CartesianPosition =
      Ellipsoid.WGS84.cartographicToCartesian(pt4Position);

    pointEntities.entities.add(
      new Entity({
        name: "Parliament house Pt 1",
        position: new ConstantPositionProperty(pt1CartesianPosition)
      })
    );

    pointEntities.entities.add(
      new Entity({
        name: "Parliament house Pt 2",
        position: new ConstantPositionProperty(pt2CartesianPosition)
      })
    );
    pointEntities.entities.add(
      new Entity({
        name: "Parliament house Pt 3",
        position: new ConstantPositionProperty(pt3CartesianPosition)
      })
    );
    pointEntities.entities.add(
      new Entity({
        name: "Parliament house Pt 4",
        position: new ConstantPositionProperty(pt4CartesianPosition)
      })
    );
    pointEntities.entities.add(
      new Entity({
        name: "Parliament house Pt 5",
        position: new ConstantPositionProperty(pt1CartesianPosition)
      })
    );

    // Distance between each point:
    // a = 351.66917614964854
    // b = 430.3689959315394
    // c = 351.6769210634701
    // d = 430.3731676536625:
    // So expect roughly 151349 square m, based on a*b area of rectangle.
    // But more exactly:
    // Distance along diagonal is diag 554.7311731248245 (not quite exactly rectangle so not hypotenuse)
    // Using Heron's formula, area:
    //     first triangle (a, b, diag) = 75673.1975
    //     second triangle (c, d, diag) = 75675.5889
    // So area is 151348.79, which matches rough calculation.
    // Google maps area is roughly (for slightly different points): 157,408.91 square m
    expect(updateArea(pointEntities, terria).toFixed(2)).toEqual("151348.79");
  });
});
