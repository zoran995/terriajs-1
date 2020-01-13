"use strict";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Entity from "terriajs-cesium/Source/DataSources/Entity.js";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
var PolylineGraphics = require("terriajs-cesium/Source/DataSources/PolylineGraphics")
  .default;
var GroundPolylineGeometry = require("terriajs-cesium/Source/Core/GroundPolylineGeometry");
var HeightReference = require("terriajs-cesium/Source/Scene/HeightReference")
  .default;
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var MapInteractionMode = require("./MapInteractionMode");
var DragPoints = require("../Map/DragPoints");

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var CustomDataSource = require("terriajs-cesium/Source/DataSources/CustomDataSource")
  .default;
var PointGraphics = require("terriajs-cesium/Source/DataSources/PointGraphics")
  .default;
var LabelGraphics = require("terriajs-cesium/Source/DataSources/LabelGraphics")
  .default;
var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;
var ViewerMode = require("./ViewerMode");

/**
 * For user point drawing
 *
 * @alias DrawingLine
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {Bool} [options.shouldRender=true] Way to determine is it measure function
 */
var DrawingLine = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  if (!defined(options.terria)) {
    throw new DeveloperError(i18next.t("models.userDrawing.devError"));
  }

  this.shouldRender = defaultValue(options.shouldRender, false);

  /**
   * Instance of Terria
   * @type {Terria}
   * @default undefined
   */
  this.terria = options.terria;

  /**
   * Storage for lines that are drawn
   * @type {CustomDataSource}
   */
  this.drawnEntities = this.terria.drawnEntities;
  knockout.getObservable(this.terria, "drawnEntities").subscribe(function() {
    setLineEntities(this);
  }, this);

  /**
   * Storage for points constructing a line
   */
  this.linePointEntities = new CustomDataSource("linePoints");

  /**
   * Storage for line while user is drawing
   */
  this.tempLine = new CustomDataSource("tempLine");

  /**
   * Whether to interpret user clicks as drawing
   * @type {Bool}
   */
  this.inDrawMode = false;

  // helper for dragging points around
  var that = this;
  this.dragHelper = new DragPoints(options.terria, function(customDataSource) {
    if (typeof that.onPointMoved === "function") {
      that.onPointMoved(customDataSource);
    }
  });
  this.activeShapePoints = [];
  this.floatingPoint = undefined;

  function setLineEntities(drawing) {
    drawing.drawnEntities = drawing.terria.drawnEntities;
  }
};
DrawingLine.prototype._addPointEntities = function() {
  this.terria.dataSources.add(this.linePointEntities);
};

DrawingLine.prototype._removePointEntities = function() {
  this.terria.dataSources.remove(this.linePointEntities);
};

DrawingLine.prototype._addTempLine = function() {
  this.terria.dataSources.add(this.tempLine);
};

DrawingLine.prototype._removeTempLine = function() {
  this.terria.dataSources.remove(this.tempLine);
};

/**
 * Start interpreting user clicks as placing or removing points.
 */
DrawingLine.prototype.enterDrawMode = function() {
  this.dragHelper.setUp();

  // If we have finished a polygon, don't allow more points to be drawn. In future, perhaps support multiple polygons.
  if (this.inDrawMode) {
    // Do nothing
    return;
  }

  this.inDrawMode = true;

  if (defined(this.terria.cesium)) {
    this.terria.cesium.viewer.canvas.setAttribute("style", "cursor: crosshair");
  } else if (defined(this.terria.leaflet)) {
    document
      .getElementById("cesiumContainer")
      .setAttribute("style", "cursor: crosshair");
  }

  // Cancel any feature picking already in progress.
  this.terria.pickedFeatures = undefined;
  var that = this;
  this._addPointEntities();
  this._addTempLine();
  this.terria.drawnFeaturesInteractive = true;
  // Listen for user clicks on map
  const pickPointMode = new MapInteractionMode({
    message: "",
    buttonText: "",
    onCancel: () => {
      that.terria.mapInteractionModeStack.pop();
      that._cleanUp();
    },
    render: this.shouldRender
  });
  this.terria.mapInteractionModeStack.push(pickPointMode);
  // Handle what happens when user picks a point
  knockout
    .getObservable(pickPointMode, "pickedFeatures")
    .subscribe(function(pickedFeatures) {
      when(pickedFeatures.allFeaturesAvailablePromise, function() {
        if (defined(pickedFeatures.pickPosition)) {
          var pickedPoint = pickedFeatures.pickPosition;
          if (that.activeShapePoints.length === 0) {
            that.floatingPoint = that._createPoint(pickedPoint);
            that.activeShapePoints.push(pickedPoint);
            var points = that.activeShapePoints;
            var dynamicPositions = new CallbackProperty(function() {
              return points;
            }, false);
            that._drawShape(dynamicPositions);
            that._createPoint(pickedPoint);
          }
          that.activeShapePoints.push(pickedPoint);
          that._createPoint(pickedPoint);
        }
      });
    });
  this.drawHelpers(that);
  this.terria.afterViewerChanged.addEventListener(function() {
    that.drawHelpers(that);
  });
};

DrawingLine.prototype.drawHelpers = function(drawing) {
  if (drawing.terria.viewerMode === ViewerMode.Leaflet) {
    const onMouseMove = function(movement) {
      if (defined(drawing.floatingPoint)) {
        var cartesian = Cartesian3.fromDegrees(
          movement.latlng.lng,
          movement.latlng.lat
        );
        if (cartesian) {
          drawing.floatingPoint.position.setValue(cartesian);
          drawing.activeShapePoints.pop();
          drawing.activeShapePoints.push(cartesian);
        }
      }
    };

    const onRightClick = function(e) {
      if (e.originalEvent.preventDefault) e.originalEvent.preventDefault();
      if (drawing.activeShapePoints.length >= 3) {
        drawing.activeShapePoints.pop();
        drawing.terria.drawnEntities.entities.add({
          title: "Green rhumb line",
          polyline: new PolylineGraphics({
            positions: drawing.activeShapePoints,
            width: 5,
            material: Color.WHITE,
            clampToGround: true
          })
        });
        drawing.floatingPoint = undefined;
        drawing.activeShapePoints = [];
        drawing.linePointEntities.entities.removeAll();
        drawing.tempLine.entities.removeAll();
      }
    };
    drawing.terria.leaflet.map.on("mousemove", onMouseMove, drawing);
    drawing.terria.leaflet.map.on("contextmenu", onRightClick, drawing);
  } else {
    const handler = new ScreenSpaceEventHandler(
      drawing.terria.cesium.viewer.scene.canvas,
      false
    );
    handler.setInputAction(function(movement) {
      if (defined(drawing.floatingPoint)) {
        var _scene = drawing.terria.cesium.viewer.scene;
        var pickRay = _scene.camera.getPickRay(movement.endPosition);
        var cartesian = _scene.globe.pick(pickRay, _scene);
        if (cartesian) {
          drawing.floatingPoint.position.setValue(cartesian);
          drawing.activeShapePoints.pop();
          drawing.activeShapePoints.push(cartesian);
        }
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function(e) {
      if (drawing.activeShapePoints.length >= 3) {
        drawing.activeShapePoints.pop();
        drawing.tempLine.entities.removeAll();
        drawing.drawnEntities.entities.add({
          title: "Green rhumb line",
          polyline: new PolylineGraphics({
            positions: drawing.activeShapePoints,
            width: 5,
            material: Color.WHITE,
            clampToGround: true
          })
        });
        drawing.floatingPoint = undefined;
        drawing.activeShapePoints = [];
        drawing.linePointEntities.entities.removeAll();
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }
};

DrawingLine.prototype._drawShape = function(positionData) {
  var shape;
  shape = this.tempLine.entities.add({
    polyline: {
      positions: positionData,
      material: Color.WHITE,
      clampToGround: true,
      width: 3
    }
  });
  return shape;
};

/**
 * User has finished or cancelled; restore initial state.
 * @private
 */
DrawingLine.prototype._cleanUp = function() {
  this.inDrawMode = false;
  this._removePointEntities();
  this._removeTempLine();

  // this.terria.dataSources.remove(this.linePointEntities);
  this.linePointEntities = new CustomDataSource("linePoints");
  //this.tempLine = new CustomDataSource("tempLine");
  // Return cursor to original state
  if (defined(this.terria.cesium)) {
    this.terria.cesium.viewer.canvas.setAttribute("style", "cursor: auto");
  } else if (defined(this.terria.leaflet)) {
    document
      .getElementById("cesiumContainer")
      .setAttribute("style", "cursor: auto");
  }
  this.terria.drawnFeaturesInteractive = false;
  // Allow client to clean up too
  if (typeof this.onCleanUp === "function") {
    this.onCleanUp();
  }
  this.dragHelper.updateDraggableObjects([]);
  this.terria.currentViewer.notifyRepaintRequired();
};

DrawingLine.prototype._createPoint = function(position) {
  var point = new Entity({
    name: name,
    position: position,
    title: name,
    isToolVisible: "true",
    point: {
      show: true,
      pixelSize: 8,
      color: Color.WHITE,
      heightReference: HeightReference.CLAMP_TO_GROUND
    }
  });
  this.linePointEntities.entities.add(point);
  return point;
};

module.exports = DrawingLine;
