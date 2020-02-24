"use strict";

var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var zoomRectangleFromPoint = require("./zoomRectangleFromPoint");

module.exports = function zoomToEntity(feature, terria) {
  var rectangle;
  if (defined(feature.polygon)) {
    var hierarchy = feature.polygon.hierarchy.getValue();
    rectangle = Rectangle.fromCartesianArray(hierarchy.positions);
  } else if (defined(feature.polyline)) {
    rectangle = Rectangle.fromCartesianArray(
      feature.polyline.positions.getValue()
    );
  } else if (defined(feature.point)) {
    const bboxSize = 0.1;
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
      feature.position.getValue()
    );
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    rectangle = zoomRectangleFromPoint(latitude, longitude, bboxSize);
  }
  terria.currentViewer.zoomTo(rectangle);
};
