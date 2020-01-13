"use strict";
import Entity from "terriajs-cesium/Source/DataSources/Entity.js";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
import HeightReference from "terriajs-cesium/Source/Scene/HeightReference";
var MapInteractionMode = require("./MapInteractionMode");
var DragPoints = require("../Map/DragPoints");
var DrawLineHelper = require("../Map/DrawLineHelper");
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var CustomDataSource = require("terriajs-cesium/Source/DataSources/CustomDataSource")
  .default;
var PointGraphics = require("terriajs-cesium/Source/DataSources/PointGraphics")
  .default;
var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;

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

  this.drawLineHelper = new DrawLineHelper(options.terria);

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
  var activeShapePoints = [];
  var activeShape;
  var floatingPoint;
  // Line will show up once user has drawn some points. Vertices of line are user points.
  /* this.tempLine.entities.add({
    name: i18next.t("models.userDrawing.line"),
    polyline: {
      positions: new CallbackProperty(function(date, result) {
        return activeShapePoints;
      }, false),

      material: new Color(0.0, 0.0, 0.0, 1),
      width: 1
    }
  }); */
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
          if (activeShapePoints.length === 0) {
            floatingPoint = that._createPoint(pickedPoint);
            activeShapePoints.push(pickedPoint);
            var dynamicPositions = new CallbackProperty(function() {
              return activeShapePoints;
            }, false);
            activeShape = that._drawShape(dynamicPositions);
            that._createPoint(pickedPoint);
          }
          activeShapePoints.push(pickedPoint);
        }
      });
    });
  const handler = new ScreenSpaceEventHandler(
    that.terria.cesium.viewer.scene.canvas,
    false
  );
  handler.setInputAction(function(movement) {
    if (defined(floatingPoint)) {
      var _scene = that.terria.cesium.viewer.scene;
      var pickRay = _scene.camera.getPickRay(movement.endPosition);
      var cartesian = _scene.globe.pick(pickRay, _scene);
      if (cartesian) {
        floatingPoint.position.setValue(cartesian);
        activeShapePoints.pop();
        activeShapePoints.push(cartesian);
      }
    }
  }, ScreenSpaceEventType.MOUSE_MOVE);
};

DrawingLine.prototype._drawShape = function(positionData) {
  var shape;
  shape = this.drawnEntities.entities.add({
    polyline: {
      positions: positionData,
      clampToGround: true,
      width: 3
    }
  });
  console.log(this.drawnEntities);
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
  return point;
};

/**
 * Return a list of the coords for the user drawing
 * @return {Array} An array of coordinates for the user-drawn shape
 * @private
 */
DrawingLine.prototype._getPointsForShape = function() {
  if (defined(this.linePointEntities.entities)) {
    var pos = [];
    for (var i = 0; i < this.linePointEntities.entities.values.length; i++) {
      var obj = this.linePointEntities.entities.values[i];
      if (defined(obj.position)) {
        var position = obj.position.getValue(this.terria.clock.currentTime);
        pos.push(position.clone());
      }
    }
    return pos;
  }
};
module.exports = DrawingLine;
