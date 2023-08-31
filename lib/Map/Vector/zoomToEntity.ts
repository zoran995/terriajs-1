"use strict";

import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import isDefined from "../../Core/isDefined";
import Terria from "../../Models/Terria";

var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var zoomRectangleFromPoint = require("./zoomRectangleFromPoint");

const zoomToEntity = function zoomToEntity(terria: Terria, feature?: Entity) {
  var rectangle;
  if (!isDefined(feature)) {
    return;
  }
  if (isDefined(feature.polygon)) {
    var hierarchy = feature.polygon.hierarchy?.getValue(
      terria.timelineClock.currentTime
    );
    rectangle = Rectangle.fromCartesianArray(hierarchy.positions);
  } else if (isDefined(feature.polyline)) {
    rectangle = Rectangle.fromCartesianArray(
      feature.polyline.positions?.getValue(terria.timelineClock.currentTime)
    );
  } else if (isDefined(feature.point)) {
    let bboxSize = 0.2;
    const boundingRectangle =
      terria.currentViewer.getCurrentCameraView().rectangle;
    const bbox =
      boundingRectangle.width < boundingRectangle.height
        ? CesiumMath.toDegrees(boundingRectangle.width)
        : CesiumMath.toDegrees(boundingRectangle.height);
    if (bbox && bbox < bboxSize) {
      bboxSize = bbox;
    }
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
      feature.position!.getValue(terria.timelineClock.currentTime)
    );
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    rectangle = zoomRectangleFromPoint(latitude, longitude, bboxSize);
  }
  terria.currentViewer.zoomTo(rectangle, 1);
};

export default zoomToEntity;
