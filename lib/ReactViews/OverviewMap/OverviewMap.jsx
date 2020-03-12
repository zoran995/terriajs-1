"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import CallbackProperty from "terriajs-cesium/Source/DataSources/CallbackProperty";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
import ConsoleAnalytics from "../../Core/ConsoleAnalytics";
import OpenStreetMapCatalogItem from "../../Models/OpenStreetMapCatalogItem";
import Terria from "../../Models/Terria";
import ViewerMode from "../../Models/ViewerMode";
import TerriaViewer from "../../ViewModels/TerriaViewer.js";
import Styles from "./overview-map.scss";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import defined from "terriajs-cesium/Source/Core/defined";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";

const OverviewMap = createReactClass({
  displayName: "OverviewMap",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  componentDidMount() {
    const terria = this.props.terria;
    const { t } = this.props;
    this.overviewMapEntities = new CustomDataSource("overviewMap");

    // creating new instance of Terria for everview map
    this.terriaOverviewMap = new Terria({
      appName: t("preview.preview", { appName: terria.appName }),
      supportEmail: terria.supportEmail,
      baseUrl: terria.baseUrl,
      analytics: new ConsoleAnalytics()
    });

    this.terriaOverviewMap.configParameters.hideTerriaLogo = true;
    // set a 2D viewer mode for overview map
    this.terriaOverviewMap.viewerMode = ViewerMode.Leaflet;
    this.maxViewWidth = 45;
    // set home and initial view same as for the main map
    this.terriaOverviewMap.homeView = terria.homeView;
    this.terriaOverviewMap.initialView = terria.homeView;
    // TODO: we shouldn't hard code the base map here. (copied from branch analyticsWithCharts)
    const positron = new OpenStreetMapCatalogItem(this.terriaOverviewMap);
    positron.name = "Positron (Light)";
    positron.url = "//global.ssl.fastly.net/light_all/";
    positron.opacity = 1.0;
    positron.subdomains = [
      "cartodb-basemaps-a",
      "cartodb-basemaps-b",
      "cartodb-basemaps-c",
      "cartodb-basemaps-d"
    ];
    this.terriaOverviewMap.baseMap = positron;
    this.initMap();
    this._unsubscribeFromBeforeViewerChange = this.props.terria.beforeViewerChanged.addEventListener(
      () => {
        if (this.props.terria.leaflet) {
          const center = this.props.terria.leaflet.map.getCenter();
          this.lastCenter = Cartesian3.fromDegrees(center.lng, center.lat);
        } else if (this.props.terria.cesium) {
          this.lastCenter = getCenterCesium(this);
        }

        this.overviewMapEntities.entities.removeAll();
      }
    );
    this._unsubscribeFromViewerChange = this.props.terria.afterViewerChanged.addEventListener(
      () => {
        getBoundingRectangle(this);
      }
    );
    getBoundingRectangle(this);
    this.terriaOverviewMap.dataSources.add(this.overviewMapEntities);
    this.terriaOverviewMap.currentViewer.notifyRepaintRequired();
  },

  componentWillUnmount() {
    this.destroyOverviewMap();
  },

  destroyOverviewMap() {
    // this.terriaViewer && this.terriaViewer.destroy();
    this._unsubscribeFromBeforeViewerChange &&
      this._unsubscribeFromBeforeViewerChange();
    this._unsubscribeFromViewerChange && this._unsubscribeFromViewerChange();
    this._unsubscribeFromBeforeViewerChange = undefined;
    this._unsubscribeFromViewerChange = undefined;

    if (this.mapElement) {
      this.mapElement.innerHTML = "";
    }
  },

  initMap() {
    if (this.mapElement) {
      this.terriaViewer = TerriaViewer.create(this.terriaOverviewMap, {
        mapContainer: this.mapElement
      });
      // remove credit from overview map
      // this.terriaViewer.terria.leaflet.map.attributionControl.setPrefix("");
      // disable overview map interaction
      const map = this.terriaViewer.terria.leaflet.map;
      map.boxZoom.disable();
      map.keyboard.disable();
      map.dragging.disable();
      /* map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();     
       */
    }
    this.updatePreview();
  },

  updatePreview() {
    this.terriaOverviewMap.currentViewer.zoomTo(
      this.terriaOverviewMap.homeView
    );
  },

  render() {
    return (
      <div className={Styles.map}>
        <div
          className={classNames(Styles.terriaOverviewMap)}
          ref={element => {
            this.mapElement = element;
          }}
        />
      </div>
    );
  }
});

function getBoundingRectangle(overviewMap) {
  overviewMap.positions = undefined;
  if (overviewMap.props.terria.cesium) {
    getBoundingRectangleCesium(overviewMap);
  } else if (overviewMap.props.terria.leaflet) {
    getBoundingRectangleLeaflet(overviewMap);
  }
  addEntity(overviewMap);
}

function getBoundingRectangleCesium(overviewMap) {
  const center = getCenterCesium(overviewMap);
  let rectangle;
  if (!defined(center) && defined(overviewMap.lastCenter)) {
    rectangle = getCurrentExtentWithCenter(overviewMap, overviewMap.lastCenter);
  } else {
    rectangle = overviewMap.props.terria.cesium.getCurrentExtent();
  }

  overviewMap.positions = rectangleToPolyline(
    rectangle,
    overviewMap.maxViewWidth
  );
  overviewMap.props.terria.cesium.viewer.camera.changed.addEventListener(
    function() {
      moveToCenterCesium(overviewMap);
      rectangle = overviewMap.props.terria.cesium.getCurrentExtent();
      overviewMap.positions = rectangleToPolyline(
        rectangle,
        overviewMap.maxViewWidth
      );
    },
    overviewMap
  );
  overviewMap.props.terria.cesium.viewer.camera.percentageChanged = 0.01;
}

function getBoundingRectangleLeaflet(overviewMap) {
  const map = overviewMap.props.terria.leaflet.map;
  moveToCenterLeaflet(overviewMap, map);
  let mapBounds = map.getBounds();
  overviewMap.positions = boundsToPolyline(mapBounds, overviewMap.maxViewWidth);
  map.on(
    "moveend",
    function(e) {
      moveToCenterLeaflet(overviewMap, map);
      mapBounds = map.getBounds();
      overviewMap.positions = boundsToPolyline(
        mapBounds,
        overviewMap.maxViewWidth
      );
    },
    overviewMap
  );
}

function addEntity(overviewMap) {
  overviewMap.overviewMapEntities.entities.add({
    name: "viewbox",
    polyline: {
      positions: new CallbackProperty(function(date, result) {
        return overviewMap.positions;
      }, false),
      material: new Color(1.0, 0.0, 0.0, 0.5)
    }
  });
}

function rectangleToPolyline(rectangle, maxViewWidth) {
  const west = CesiumMath.toDegrees(rectangle.west);
  const east = CesiumMath.toDegrees(rectangle.east);
  if (Math.abs(east - west) > maxViewWidth) {
    return null;
  }
  const sw = Rectangle.southwest(rectangle);
  const se = Rectangle.southeast(rectangle);
  const nw = Rectangle.northwest(rectangle);
  const ne = Rectangle.northeast(rectangle);

  const polyline = [
    CesiumMath.toDegrees(sw.longitude),
    CesiumMath.toDegrees(sw.latitude),
    CesiumMath.toDegrees(se.longitude),
    CesiumMath.toDegrees(se.latitude),
    CesiumMath.toDegrees(ne.longitude),
    CesiumMath.toDegrees(ne.latitude),
    CesiumMath.toDegrees(nw.longitude),
    CesiumMath.toDegrees(nw.latitude),
    CesiumMath.toDegrees(sw.longitude),
    CesiumMath.toDegrees(sw.latitude)
  ];
  return Cartesian3.fromDegreesArray(polyline);
}

function boundsToPolyline(mapBounds, maxViewWidth) {
  const west = mapBounds.getWest();
  const east = mapBounds.getEast();
  if (east - west > maxViewWidth) {
    return null;
  }
  const sw = mapBounds.getSouthWest();
  const se = mapBounds.getSouthEast();
  const nw = mapBounds.getNorthWest();
  const ne = mapBounds.getNorthEast();
  const polyline = [
    sw.lng,
    sw.lat,
    se.lng,
    se.lat,
    ne.lng,
    ne.lat,
    nw.lng,
    nw.lat,
    sw.lng,
    sw.lat
  ];
  return Cartesian3.fromDegreesArray(polyline);
}

function getCenterCesium(overviewMap) {
  const width = overviewMap.props.terria.cesium.viewer.scene.canvas.clientWidth;
  const height =
    overviewMap.props.terria.cesium.viewer.scene.canvas.clientHeight;
  const centerOfScreen = new Cartesian2(width / 2.0, height / 2.0);
  const pickRay = overviewMap.props.terria.cesium.viewer.scene.camera.getPickRay(
    centerOfScreen
  );
  const centerCartesian = overviewMap.props.terria.cesium.viewer.scene.globe.pick(
    pickRay,
    overviewMap.props.terria.cesium.viewer.scene
  );
  return centerCartesian;
}

function moveToCenterCesium(overviewMap) {
  const centerCartesian = getCenterCesium(overviewMap);
  if (!defined(centerCartesian)) {
    return;
  }
  const centerCartographic = overviewMap.props.terria.cesium.viewer.scene.globe.ellipsoid.cartesianToCartographic(
    centerCartesian
  );
  const center = {
    lat: CesiumMath.toDegrees(centerCartographic.latitude),
    lng: CesiumMath.toDegrees(centerCartographic.longitude)
  };
  overviewMap.terriaViewer.terria.leaflet.map.panTo(center);
}

function moveToCenterLeaflet(overviewMap, map) {
  const center = map.getCenter();
  overviewMap.terriaViewer.terria.leaflet.map.panTo(center);
}

function getCurrentExtentWithCenter(overviewMap, center) {
  const scene = overviewMap.props.terria.cesium.scene;
  const camera = scene.camera;

  const cartesian3Scratch = new Cartesian3();
  const enuToFixedScratch = new Matrix4();
  const southwestScratch = new Cartesian3();
  const southeastScratch = new Cartesian3();
  const northeastScratch = new Cartesian3();
  const northwestScratch = new Cartesian3();
  const southwestCartographicScratch = new Cartographic();
  const southeastCartographicScratch = new Cartographic();
  const northeastCartographicScratch = new Cartographic();
  const northwestCartographicScratch = new Cartographic();

  /* const width = scene.canvas.clientWidth;
  const height = scene.canvas.clientHeight;

  const centerOfScreen = new Cartesian2(width / 2.0, height / 2.0);
  const pickRay = scene.camera.getPickRay(centerOfScreen);
  const center = scene.globe.pick(pickRay, scene); */
  const ellipsoid = scene.globe.ellipsoid;

  const fovy = scene.camera.frustum.fovy * 0.5;
  const fovx = Math.atan(Math.tan(fovy) * scene.camera.frustum.aspectRatio);

  const cameraOffset = Cartesian3.subtract(
    camera.positionWC,
    center,
    cartesian3Scratch
  );
  const cameraHeight = Cartesian3.magnitude(cameraOffset);
  const xDistance = cameraHeight * Math.tan(fovx);
  const yDistance = cameraHeight * Math.tan(fovy);

  const southwestEnu = new Cartesian3(-xDistance, -yDistance, 0.0);
  const southeastEnu = new Cartesian3(xDistance, -yDistance, 0.0);
  const northeastEnu = new Cartesian3(xDistance, yDistance, 0.0);
  const northwestEnu = new Cartesian3(-xDistance, yDistance, 0.0);
  const enuToFixed = Transforms.eastNorthUpToFixedFrame(
    center,
    ellipsoid,
    enuToFixedScratch
  );
  const southwest = Matrix4.multiplyByPoint(
    enuToFixed,
    southwestEnu,
    southwestScratch
  );
  const southeast = Matrix4.multiplyByPoint(
    enuToFixed,
    southeastEnu,
    southeastScratch
  );
  const northeast = Matrix4.multiplyByPoint(
    enuToFixed,
    northeastEnu,
    northeastScratch
  );
  const northwest = Matrix4.multiplyByPoint(
    enuToFixed,
    northwestEnu,
    northwestScratch
  );

  const southwestCartographic = ellipsoid.cartesianToCartographic(
    southwest,
    southwestCartographicScratch
  );
  const southeastCartographic = ellipsoid.cartesianToCartographic(
    southeast,
    southeastCartographicScratch
  );
  const northeastCartographic = ellipsoid.cartesianToCartographic(
    northeast,
    northeastCartographicScratch
  );
  const northwestCartographic = ellipsoid.cartesianToCartographic(
    northwest,
    northwestCartographicScratch
  );
  // Account for date-line wrapping
  if (southeastCartographic.longitude < southwestCartographic.longitude) {
    southeastCartographic.longitude += CesiumMath.TWO_PI;
  }
  if (northeastCartographic.longitude < northwestCartographic.longitude) {
    northeastCartographic.longitude += CesiumMath.TWO_PI;
  }

  const rect = new Rectangle(
    CesiumMath.convertLongitudeRange(
      Math.min(southwestCartographic.longitude, northwestCartographic.longitude)
    ),
    Math.min(southwestCartographic.latitude, southeastCartographic.latitude),
    CesiumMath.convertLongitudeRange(
      Math.max(northeastCartographic.longitude, southeastCartographic.longitude)
    ),
    Math.max(northeastCartographic.latitude, northwestCartographic.latitude)
  );
  rect.center = center;
  return rect;
}

module.exports = withTranslation()(OverviewMap);
