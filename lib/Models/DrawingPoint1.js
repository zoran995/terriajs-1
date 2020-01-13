"use strict";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
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

var Color = require("terriajs-cesium/Source/Core/Color").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var Entity = require("terriajs-cesium/Source/DataSources/Entity.js").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");

/**
 * For user point drawing
 *
 * @alias DrawingPoint
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 * @param {Bool} [options.shouldRender=true] Way to determine is it measure function
 */
var DrawingPoint = function(options) {
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
   * Storage for points that are drawn
   * @type {CustomDataSource}
   */
  this.pointEntities = this.terria.drawnEntities;
  knockout.getObservable(this.terria, "drawnEntities").subscribe(function() {
    setPointEntities(this);
  }, this);
  /**
   * Whether to interpret user clicks as drawing
   * @type {Bool}
   */
  this.inDrawMode = false;

  this.setFeatureList = options.setFeatureList;

  this.pointDefaultColor = Color.WHITE;

  this.pointDefaultOutlineColor = new Color(0 / 255, 170 / 255, 215 / 255, 1);

  this.pointDefaultOutlineWidth = 4;

  this.pointDefaultSize = 10;

  // helper for dragging points around
  var that = this;
  this.dragHelper = new DragPoints(options.terria, function(customDataSource) {
    if (typeof that.onPointMoved === "function") {
      that.onPointMoved(customDataSource);
    }
    //that._prepareToAddNewPoint();
  });

  function setPointEntities(drawing) {
    drawing.pointEntities = drawing.terria.drawnEntities;
  }
};

DrawingPoint.prototype._addPointEntities = function() {
  if (!this.terria.dataSources.contains(this.pointEntities))
    this.terria.dataSources.add(this.pointEntities);
};

/**
 * Start interpreting user clicks as placing or removing points.
 */
DrawingPoint.prototype.enterPointDrawMode = function() {
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
  this.terria.drawnFeaturesInteractive = true;

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
  knockout
    .getObservable(this.terria, "drawnFeaturesInteractive")
    .subscribe(function() {
      //this._changeInteractivity(this);
    }, this);
};

DrawingPoint.prototype._changeInteractivity = function(drawing) {
  console.log(drawing.pointEntities.entities.values[0].point);
  drawing.pointEntities.entities.values[0].point.interactive = false;
  console.log(drawing.pointEntities.entities.values[0].point.interactive);
  drawing.terria.currentViewer.notifyRepaintRequired();
};

/**
 * Called after a point has been added, this updates the MapInteractionModeStack with a listener for another point.
 * @private
 */
DrawingPoint.prototype._mapInteractionModeUpdate = function() {
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
 * Called after a point has been added, prepares to add and draw another point, as well as updating the dialog.
 * @private
 */
DrawingPoint.prototype._prepareToAddNewPoint = function() {
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

/**
 * User has finished or cancelled; restore initial state.
 * @private
 */
DrawingPoint.prototype._cleanUp = function() {
  this.inDrawMode = false;

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
};

DrawingPoint.prototype.removeAllFeatures = function() {
  this.terria.dataSources.remove(this.pointEntities);
  this.terria.drawnEntities = new CustomDataSource("drawnPoints");
  this.terria.mapInteractionModeStack.pop();
  this._cleanUp();
  this.setFeatureList(this.pointEntities.entities.values);
  this.dragHelper.updateDraggableObjects(this.pointEntities);
  this.terria.currentViewer.notifyRepaintRequired();
};

DrawingPoint.prototype.removeFeature = function(feature) {
  this.pointEntities.entities.removeById(feature.id);
  this.setFeatureList(this.pointEntities.entities.values);
  this.terria.currentViewer.notifyRepaintRequired();
};

/**
 * Find out if user clicked an existing point and handle appropriately.
 * @param {PickedFeatures} features Feature/s that are under the point the user picked
 * @return {Bool} Whether user had clicked an existing point
 * @private
 */
DrawingPoint.prototype._clickedExistingPoint = function(features) {
  var userClickedExistingPoint = false;

  if (features.length < 1) {
    return userClickedExistingPoint;
  }

  features.forEach(feature => {
    var index = -1;
    for (var i = 0; i < this.pointEntities.entities.values.length; i++) {
      var pointFeature = this.pointEntities.entities.values[i];
      if (pointFeature.id === feature.id) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      // Probably a layer or feature that has nothing to do with what we're drawing.
      return;
    } else {
      // User clicked existing point
      userClickedExistingPoint = true;
      return;
    }
  });
  return userClickedExistingPoint;
};

/**
 * Add new point to list of pointEntities
 * @param {String} name What to call new point
 * @param {Cartesian3} position Position of new point
 * @private
 */
DrawingPoint.prototype._addPointToPointEntities = function(name, position) {
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
    }),
    label: new LabelGraphics({
      show: true,
      text: name,
      font: "14px sans-serif",
      pixelOffset: new Cartesian2(0, -12),
      interactive: false
    })
  });
  this.pointEntities.entities.add(pointEntity);
  this.dragHelper.updateDraggableObjects(this.pointEntities);
  if (typeof this.onPointClicked === "function") {
    this.onPointClicked(this.pointEntities);
  }
  this.setFeatureList(this.pointEntities.entities.values);
};

/**
 * Updates the style of the point
 * @param {Object} feature Object that the represent point feature, can be changed for id
 * @param {Object} options Object with the following properties:
 * @param {Number} options.pixelSize The size of point instance.
 * @param {Color} [options.color] Color of the point
 * @param {Color} [options.outlineColor] Color of the point outline
 * @param {Number} [options.outlineWidth] Width of the point outline
 */

DrawingPoint.prototype.changePointStyle = function(feature, options) {
  const entity = this.pointEntities.entities.getById(feature.id);
  if (defined(entity.point)) {
    entity.point.pixelSize = options.pixelSize || entity.point.pixelSize;
    entity.point.color = options.color || entity.point.pixelSize;
    entity.point.outlineColor =
      options.outlineColor || entity.point.outlineColor;
    entity.point.outlineWidth =
      options.outlineWidth || entity.point.outlineWidth;
  }
  this.terria.currentViewer.notifyRepaintRequired();
};

/**
 * Updates the label and label style
 * @param {Object} feature Object that the represent point feature, can be changed for id
 * @param {Object} options Object with the following properties:
 * @param {Bool} options.show A boolean Property specifying the visibility of the label.
 * @param {String} options.label A Property specifying the text. Explicit newlines '\n' are supported.
 * @param {} options.font A Property specifying the CSS font.
 * @param {LabelStyle} options.style A Property specifying the LabelStyle.
 * @param {Bool} options.showBackground A boolean Property specifying the visibility of the background behind the label.
 * @param {Color} options.backgroundColor A Property specifying the background Color.
 * @param {Cartesian2} options.backgroundPadding  A Cartesian2 Property specifying the horizontal and vertical background padding in pixels.
 * @param {Cartesian2} options.pixelOffset A Cartesian2 Property specifying the pixel offset.
 * @param {Cartesian3} options.eyeOffset A Cartesian3 Property specifying the eye offset.
 * @param {HorizontalOrigin} options.horizontalOrigin A Property specifying the HorizontalOrigin.
 * @param {VerticalOrigin} options.verticalOrigin A Property specifying the VerticalOrigin.
 * @param {Color} options.fillColor A Property specifying the fill Color.
 * @param {Color} options.outlineColor A Property specifying the outline Color.
 * @param {Number} options.outlineWidth A numeric Property specifying the outline width.
 */
DrawingPoint.prototype.updateLabel = function(feature, options) {
  const entity = this.pointEntities.entities.getById(feature.id);
  const entityLabel = entity.label;

  if (defined(entityLabel)) {
    entityLabel.show = options.show || entityLabel.show;
    entityLabel.text = options.label || entityLabel.text;
    entityLabel.font = options.font || entityLabel.font;
    entityLabel.style = options.style || entityLabel.style;
    entityLabel.showBackground =
      options.showBackground || entityLabel.showBackground;
    entityLabel.backgroundColor =
      options.backgroundColor || entityLabel.backgroundColor;
    entityLabel.backgroundPadding =
      options.backgroundPadding || entityLabel.backgroundPadding;
    entityLabel.pixelOffset = options.pixelOffset || entityLabel.pixelOffset;
    entityLabel.eyeOffset = options.eyeOffset || entityLabel.eyeOffset;
    entityLabel.horizontalOrigin =
      options.horizontalOrigin || entityLabel.horizontalOrigin;
    entityLabel.verticalOrigin =
      options.verticalOrigin || entityLabel.verticalOrigin;
    entityLabel.fillColor = options.fillColor || entityLabel.fillColor;
    entityLabel.outlineColor = options.outlineColor || entityLabel.outlineColor;
    entityLabel.outlineWidth = options.outlineWidth || entityLabel.outlineWidth;
  }
  this.terria.currentViewer.notifyRepaintRequired();
};

DrawingPoint.prototype.zoomToPoint = function(feature) {
  const bboxSize = 2;
  const cartographic = Ellipsoid.WGS84.cartesianToCartographic(
    feature.position.getValue()
  );
  const longitude = CesiumMath.toDegrees(cartographic.longitude);
  const latitude = CesiumMath.toDegrees(cartographic.latitude);
  var rectangle = zoomRectangleFromPoint(latitude, longitude, bboxSize);
  this.terria.currentViewer.zoomTo(rectangle);
};

DrawingPoint.prototype.toggleFeatureVisibility = function(feature, bool) {
  const entity = this.pointEntities.entities.getById(feature.id);
  if (defined(entity.point)) {
    entity.point.show = bool;
  }
  if (defined(entity.label)) {
    entity.label.show = bool;
  }
  this.terria.currentViewer.notifyRepaintRequired();
};

module.exports = DrawingPoint;
