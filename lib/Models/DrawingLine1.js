"use strict";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Entity from "terriajs-cesium/Source/DataSources/Entity.js";
import ScreenSpaceEventHandler from "terriajs-cesium/Source/Core/ScreenSpaceEventHandler";
import ScreenSpaceEventType from "terriajs-cesium/Source/Core/ScreenSpaceEventType";
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
    //that._prepareToAddNewPoint();
  });

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

  // Line will show up once user has drawn some points. Vertices of line are user points.
  this.tempLine.entities.add({
    name: i18next.t("models.userDrawing.line"),
    polyline: {
      positions: new CallbackProperty(function(date, result) {
        var pos = that._getPointsForShape();
        if (that.closeLoop) {
          pos.push(pos[0]);
        }
        return pos;
      }, false),

      material: new Color(0.0, 0.0, 0.0, 1),
      width: 1
    }
  });
  // Listen for user clicks on map
  const pickPointMode = new MapInteractionMode({
    message: "",
    buttonText: "",
    onCancel: function() {
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
          that._addPointToPointEntities(
            i18next.t("models.userDrawing.firstPoint"),
            pickedPoint
          );
          that._prepareToAddNewPoint();
        }
      });
    });
};

/**
 * Called after a point has been added, this updates the MapInteractionModeStack with a listener for another point.
 * @private
 */
DrawingLine.prototype._mapInteractionModeUpdate = function() {
  this.terria.mapInteractionModeStack.pop();
  var that = this;
  const pickPointMode = new MapInteractionMode({
    message: "",
    buttonText: "",
    onCancel: function() {
      that.terria.mapInteractionModeStack.pop();
      that._cleanUp();
    },
    render: this.shouldRender
  });
  this.terria.mapInteractionModeStack.push(pickPointMode);
  return pickPointMode;
};

/**
 * User has finished or cancelled; restore initial state.
 * @private
 */
DrawingLine.prototype._cleanUp = function() {
  console.log("aaa");
  console.log("bb");
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
  console.log(this.tempLine);
  console.log(this.linePointEntities);
  console.log(this.drawnEntities);
};

/**
 * Called after a point has been added, prepares to add and draw another point, as well as updating the dialog.
 * @private
 */
DrawingLine.prototype._prepareToAddNewPoint = function() {
  var pickPointMode = this._mapInteractionModeUpdate();
  var that = this;

  knockout
    .getObservable(pickPointMode, "pickedFeatures")
    .subscribe(function(pickedFeatures) {
      when(pickedFeatures.allFeaturesAvailablePromise, function() {
        if (defined(pickedFeatures.pickPosition)) {
          var pickedPoint = pickedFeatures.pickPosition;
          // If existing point was picked, _clickedExistingPoint handles that, and returns true.
          // getDragCount helps us determine if the point was actually dragged rather than clicked. If it was
          // dragged, we shouldn't treat it as a clicked-existing-point scenario.
          if (
            that.dragHelper.getDragCount() < 10 &&
            !that._clickedExistingPoint(pickedFeatures.features)
          ) {
            // No existing point was picked, so add a new point
            that._addPointToPointEntities(
              i18next.t("models.userDrawing.anotherPoint"),
              pickedPoint
            );
          } else {
            that.dragHelper.resetDragCount();
          }
          that._prepareToAddNewPoint();
        }
      });
    });
};

DrawingLine.prototype._closeLine = function() {
  var that = this;
  return new Promise((resolve, reject) => {
    this.drawnEntities.entities.add({
      name: i18next.t("models.userDrawing.line"),
      polyline: {
        positions: that._getPointsForShape(),
        material: new Color(0.0, 0.0, 0.0, 1),
        width: 1
      }
    });
  });
};

/**
 * Find out if user clicked an existing point and handle appropriately.
 * @param {PickedFeatures} features Feature/s that are under the point the user picked
 * @return {Bool} Whether user had clicked an existing point
 * @private
 */
DrawingLine.prototype._clickedExistingPoint = function(features) {
  var userClickedExistingPoint = false;

  if (features.length < 1) {
    return userClickedExistingPoint;
  }

  features.forEach(feature => {
    var index = -1;
    for (var i = 0; i < this.linePointEntities.entities.values.length; i++) {
      var pointFeature = this.linePointEntities.entities.values[i];
      if (pointFeature.id === feature.id) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      // Probably a layer or feature that has nothing to do with what we're drawing.
      return;
    } else if (index === this.linePointEntities.entities.values.length - 1) {
      this._closeLine();
      this._cleanUp();
    } else {
      // User clicked existing point
      userClickedExistingPoint = true;
      return;
    }
  });
  return userClickedExistingPoint;
};

/**
 * Add new point to list of linePointEntities
 * @param {String} name What to call new point
 * @param {Cartesian3} position Position of new point
 * @private
 */
DrawingLine.prototype._addPointToPointEntities = function(name, position) {
  var pointEntity = new Entity({
    name: name,
    position: position,
    title: name,
    isToolVisible: "true",
    point: new PointGraphics({
      show: true,
      pixelSize: this.pointDefaultSize,
      color: this.pointDefaultColor,
      outlineColor: this.pointDefaultOutlineColor,
      outlineWidth: this.pointDefaultOutlineWidth,
      interactive: this.terria.drawnFeaturesInteractive
    })
  });
  this.linePointEntities.entities.add(pointEntity);
  this.dragHelper.updateDraggableObjects(this.linePointEntities);
  if (typeof this.onPointClicked === "function") {
    this.onPointClicked(this.linePointEntities);
  }
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
