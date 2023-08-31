import bbox from "@turf/bbox";
import { Feature } from "@turf/helpers";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import isDefined from "../../Core/isDefined";
import Terria from "../../Models/Terria";
var zoomRectangleFromPoint = require("./zoomRectangleFromPoint");

const zoomToFeature = function zoomToFeature(
  terria: Terria,
  feature?: Feature
) {
  if (!isDefined(feature)) {
    return;
  }
  let rectangle;
  if (feature.geometry.type === "Point") {
    const coordinates = feature.geometry.coordinates;
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
    rectangle = zoomRectangleFromPoint(
      coordinates[1],
      coordinates[0],
      bboxSize
    );
  } else {
    const boundingBox = bbox(feature);
    rectangle = new Rectangle(
      boundingBox[0],
      boundingBox[1],
      boundingBox[2],
      boundingBox[3]
    );
  }
  terria.currentViewer.zoomTo(rectangle, 1);
};

export default zoomToFeature;
