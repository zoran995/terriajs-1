import { runInAction } from "mobx";
import React from "react";
import { act } from "react-dom/test-utils";
import { ThemeProvider } from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import ConstantPositionProperty from "terriajs-cesium/Source/DataSources/ConstantPositionProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Terria from "../../../lib/Models/Terria";
import ViewState from "../../../lib/ReactViewModels/ViewState";
import { terriaTheme } from "../../../lib/ReactViews/StandardUserInterface/StandardTheme";
import MeasureToolPanel from "../../../lib/ReactViews/Tools/MeasureTool/MeasureToolPanel";
import { measureTypes } from "../../../lib/ReactViews/Tools/MeasureTool/MeasureUnits";

const create: any = require("react-test-renderer").create;

describe("MeasureToolPanel-tsx ", function () {
  let viewState: ViewState;
  let testRenderer: any;
  let instance: any;
  beforeEach(function () {
    let terria = new Terria();
    viewState = new ViewState({
      terria: terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });

    act(() => {
      testRenderer = create(
        <ThemeProvider theme={terriaTheme}>
          <MeasureToolPanel viewState={viewState} />
        </ThemeProvider>
      );
    });
  });

  it("renders", function () {
    expect(testRenderer.root.instance).toBeNull();
    expect(testRenderer.root.children.length).toEqual(1);

    //expect(testRenderer.root.children[0].instance).toBeDefined();
    expect(
      testRenderer.root.children[0].children[0].children[0].instance
    ).toBeDefined();
    instance = testRenderer.root.children[0].children[0].children[0].instance;
  });

  it("measures distance accurately", function () {
    runInAction(() => {
      instance.currentMeasureType = measureTypes[0];
    });
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

    instance.updateDistance(pointEntities);
    expect(instance.result.toFixed(2)).toEqual("273.23");
  });

  it("measures distance accurately with geoscience australia test", function () {
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

    instance.updateDistance(pointEntities);
    expect(instance.result.toFixed(2)).toEqual("54972.23");
  });

  it("measures distance accurately with more points", function () {
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

    instance.updateDistance(pointEntities);
    expect(instance.result.toFixed(2)).toEqual("272.46");
  });

  it("updates distance when a point is removed", function () {
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

    instance.updateDistance(pointEntities);
    expect(instance.result.toFixed(2)).toEqual("272.45");

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

    instance.updateDistance(newPointEntities);
    expect(instance.result.toFixed(2)).toEqual("54.66");
  });

  it("returns correct cartesian coordinate", function () {
    runInAction(() => {
      instance.currentMeasureType = measureTypes[2];
      instance.currentMeasureUnit = instance.currentMeasureType.units[0];
    });
    const pointEntities = new CustomDataSource();
    const position = new Cartesian3(
      -4472782.699102473,
      2674262.986482508,
      -3666130.2532728123
    );
    pointEntities.entities.add(
      new Entity({
        name: "Parl house 1",
        position: new ConstantPositionProperty(position)
      })
    );

    instance.updateCoordinate(pointEntities);
    expect(instance.result).toEqual(position);
  });
});
