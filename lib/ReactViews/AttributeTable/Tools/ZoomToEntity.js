"use strict";

const ZoomToEntity = function() {};

ZoomToEntity.prototype.zoom = function(feature) {
  var rectangle;
  if (defined(feature.polygon)) {
    var hierarchy = feature.polygon.hierarchy.getValue();
    rectangle = Rectangle.fromCartesianArray(hierarchy.positions);
  } else if (defined(feature.polyline)) {
    rectangle = Rectangle.fromCartesianArray(
      feature.polyline.positions.getValue()
    );
  } else if (defined(feature.point)) {
    const bboxSize = 2;
    const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
      feature.position.getValue()
    );
    const longitude = CesiumMath.toDegrees(cartographic.longitude);
    const latitude = CesiumMath.toDegrees(cartographic.latitude);
    rectangle = zoomRectangleFromPoint(latitude, longitude, bboxSize);
  }
  this._terria.currentViewer.zoomTo(rectangle);
};

module.exports = ZoomToEntity;
