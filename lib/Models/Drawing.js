"use strict";

var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var EventHelper = require("terriajs-cesium/Source/Core/EventHelper").default;
var CustomDataSource = require("terriajs-cesium/Source/DataSources/CustomDataSource")
  .default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var Entity = require("terriajs-cesium/Source/DataSources/Entity.js").default;
var Cartesian2 = require("terriajs-cesium/Source/Core/Cartesian2").default;
var PointGraphics = require("terriajs-cesium/Source/DataSources/PointGraphics")
  .default;
var LabelGraphics = require("terriajs-cesium/Source/DataSources/LabelGraphics")
  .default;
var PolygonHierarchy = require("terriajs-cesium/Source/Core/PolygonHierarchy")
  .default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var HeightReference = require("terriajs-cesium/Source/Scene/HeightReference")
  .default;
var ScreenSpaceEventHandler = require("terriajs-cesium/Source/Core/ScreenSpaceEventHandler")
  .default;
var ScreenSpaceEventType = require("terriajs-cesium/Source/Core/ScreenSpaceEventType")
  .default;
var PolylineGraphics = require("terriajs-cesium/Source/DataSources/PolylineGraphics")
  .default;
var PolygonGraphics = require("terriajs-cesium/Source/DataSources/PolygonGraphics")
  .default;
var Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;

var formatPropertyValue = require("../Core/formatPropertyValue");
var ViewerMode = require("./ViewerMode");
var DragPoints = require("../Map/DragPoints");
var DrawingMode = require("./DrawingMode");
var MapInteractionMode = require("./MapInteractionMode");
var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");
var prettifyCoordinates = require("../Map/prettifyCoordinates");
var i18next = require("i18next").default;

/**
 * For user drawing
 *
 * @alias Drawing
 * @constructor
 *
 * @param {Object} options Object with the following properties:
 * @param {Terria} options.terria The Terria instance.
 */
var Drawing = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  if (!defined(options.terria)) {
    throw new DeveloperError(i18next.t("models.userDrawing.devError"));
  }

  /**
   * Instance of Terria
   * @type {Terria}
   * @default undefined
   */
  this.terria = options.terria;
  this._eventSubscriptions = new EventHelper();

  /**
   * Gets or sets the event that is raised just when user trigger choose DrawingMode.
   * @type {Event}
   */
  knockout
    .getObservable(this.terria, "currentDrawingMode")
    .subscribe(function() {
      // if drawing mode change to notDefined
      if (this.terria.currentDrawingMode === DrawingMode.notDefined) {
        this._stopDrawing();
      } else if (this.terria.currentDrawingMode === DrawingMode.Point) {
        this._startDrawingPoint();
      } else if (this.terria.currentDrawingMode === DrawingMode.Line) {
        this._startDrawingLine();
      } else if (this.terria.currentDrawingMode === DrawingMode.Polygon) {
        this._startDrawingPolygon();
      }
    }, this);

  /**
   * Storage for user-created entities
   * @type {CustomDataSource}
   */
  this.drawnEntities = this.terria.drawnEntities;

  /**
   * Storage for temporary point entities created while user is drawing lines or polygons
   * @type {CustomDataSource}
   */
  this.tempPointEntities = new CustomDataSource("tempPointEntities");

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

  /**
   * Storage for temporary line or polygon entities created while user is drawing lines or polygons
   * @type {CustomDataSource}
   */
  this.tempEntities = new CustomDataSource("tempPointEntities");

  this.pointDefaultColor = Color.WHITE;

  this.pointDefaultOutlineColor = new Color(0 / 255, 170 / 255, 215 / 255, 1);

  this.pointDefaultOutlineWidth = 4;

  this.pointDefaultSize = 10;

  this.activeShapePoints = [];

  this.floatingPoint = undefined;
  /**
   * Listen for changes of drawnEntities object and get it again. This should not be triggered. But lets leave it here for now.
   */
  knockout.getObservable(this.terria, "drawnEntities").subscribe(function() {
    _setEntities(this);
  }, this);
  function _setEntities(drawing) {
    drawing.drawnEntities = drawing.terria.drawnEntities;
  }

  this.removeMouseSubscription = undefined;
};

Drawing.prototype.removeAll = function() {
  this.terria.drawnEntities.entities.removeAll();
};

Drawing.prototype.removeFeature = function(feature) {
  this.drawnEntities.entities.removeById(feature.id);
  this.terria.currentViewer.notifyRepaintRequired();
};

Drawing.prototype._addTempEntities = function() {
  this.terria.dataSources.add(this.tempPointEntities);
  this.terria.dataSources.add(this.tempEntities);
};

Drawing.prototype._enterDrawingMode = function() {
  this.terria.shouldCheckFeatureInfo = false;
  this.dragHelper.setUp();
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

  const pickPointMode = new MapInteractionMode({
    message: "",
    buttonText: "",
    onCancel: () => {
      that._stopDrawing();
    },
    render: this.shouldRender
  });
  this.terria.mapInteractionModeStack.push(pickPointMode);

  return pickPointMode;
};

Drawing.prototype._startDrawingPoint = function() {
  var that = this;
  const pickPointMode = this._enterDrawingMode();
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
            that._addPointToPointEntities("Point", pickedPoint);
          } else {
            that.dragHelper.resetDragCount();
          }
        }
      });
    });
};

Drawing.prototype._startDrawingLine = function() {
  this._addTempEntities();
  const pickPointMode = this._enterDrawingMode();
  var that = this;
  knockout
    .getObservable(pickPointMode, "pickedFeatures")
    .subscribe(function(pickedFeatures) {
      when(pickedFeatures.allFeaturesAvailablePromise, function() {
        if (defined(pickedFeatures.pickPosition)) {
          var pickedPoint = pickedFeatures.pickPosition;
          if (that.activeShapePoints.length === 0) {
            that.floatingPoint = that._createTempPoint(pickedPoint);
            that.activeShapePoints.push(pickedPoint);
            var points = that.activeShapePoints;
            var dynamicPositions = new CallbackProperty(function() {
              return points;
            }, false);
            that._drawTempShape(dynamicPositions);
            that._createTempPoint(pickedPoint);
          }
          that.activeShapePoints.push(pickedPoint);
          that._createTempPoint(pickedPoint);
        }
      });
    });
  this.drawHelpers(that);
  this.terria.afterViewerChanged.addEventListener(function() {
    that.drawHelpers(that);
  });
};

Drawing.prototype._startDrawingPolygon = function() {
  this._addTempEntities();
  const pickPointMode = this._enterDrawingMode();
  var that = this;
  knockout
    .getObservable(pickPointMode, "pickedFeatures")
    .subscribe(function(pickedFeatures) {
      when(pickedFeatures.allFeaturesAvailablePromise, function() {
        if (defined(pickedFeatures.pickPosition)) {
          var pickedPoint = pickedFeatures.pickPosition;
          if (that.activeShapePoints.length === 0) {
            that.floatingPoint = that._createTempPoint(pickedPoint);
            that.activeShapePoints.push(pickedPoint);
            var points = that.activeShapePoints;
            var dynamicPositions = new CallbackProperty(function() {
              return new PolygonHierarchy(points);
            }, false);
            that._drawTempShape(dynamicPositions);
            that._createTempPoint(pickedPoint);
          }
          that.activeShapePoints.push(pickedPoint);
          that._createTempPoint(pickedPoint);
        }
      });
    });
  this.drawHelpers(that);
  this.terria.afterViewerChanged.addEventListener(function() {
    that.drawHelpers(that);
  });
};

Drawing.prototype._stopDrawing = function() {
  this.terria.shouldCheckFeatureInfo = true;
  this.terria.mapInteractionModeStack.pop();
  this.inDrawMode = false;
  this.terria.currentDrawingMode = DrawingMode.notDefined;
  if (defined(this.terria.cesium)) {
    this.terria.cesium.viewer.canvas.setAttribute("style", "cursor: auto");
  } else if (defined(this.terria.leaflet)) {
    document
      .getElementById("cesiumContainer")
      .setAttribute("style", "cursor: auto");
  }
  this.floatingPoint = undefined;
  this.activeShapePoints = [];
  this.tempPointEntities.entities.removeAll();
  this.tempEntities.entities.removeAll();
  if (defined(this.removeUpdateSubscription)) {
    this.removeUpdateSubscription();
    this.removeUpdateSubscription = undefined;
  }
  this.terria.dataSources.remove(this.tempPointEntities);
  this.terria.dataSources.remove(this.tempEntities);

  this.dragHelper.updateDraggableObjects([]);
  this.terria.currentViewer.notifyRepaintRequired();
};

/**
 * Add new point to list of pointEntities
 * @param {String} name What to call new point
 * @param {Cartesian3} position Position of new point
 * @private
 */
Drawing.prototype._addPointToPointEntities = function(name, position) {
  const catographic = Ellipsoid.WGS84.cartesianToCartographic(position);
  const latitude = CesiumMath.toDegrees(catographic.latitude);
  const longitude = CesiumMath.toDegrees(catographic.longitude);
  const latLng = prettifyCoordinates(longitude, latitude);

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
      outlineWidth: this.pointDefaultOutlineWidth
      //interactive: this.terria.drawnFeaturesInteractive
    }),
    label: new LabelGraphics({
      show: true,
      text: name,
      font: "14px sans-serif",
      pixelOffset: new Cartesian2(0, -12)
    })
  });
  var properties = {
    title: pointEntity.title,
    latitude: latLng.latitude,
    longitude: latLng.longitude
  };

  pointEntity.properties = properties;
  pointEntity.description = describeWithoutUnderscores(
    pointEntity.properties.getValue()
  );
  this.drawnEntities.entities.add(pointEntity);
  this.dragHelper.updateDraggableObjects(this.drawnEntities);
  if (typeof this.onPointClicked === "function") {
    this.onPointClicked(this.drawnEntities);
  }
};

// This next function modelled on Cesium.geoJsonDataSource's defaultDescribe.
function describeWithoutUnderscores(props) {
  var properties = props;
  var html = "";
  for (var key in properties) {
    if (properties.hasOwnProperty(key)) {
      var value = properties[key];
      if (typeof value === "object") {
        value = describeWithoutUnderscores(value);
      } else {
        value = formatPropertyValue(value);
      }
      key = key.replace(/_/g, " ");
      if (defined(value)) {
        html += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
      }
    }
  }
  if (html.length > 0) {
    html =
      '<table class="cesium-infoBox-defaultTable"><tbody>' +
      html +
      "</tbody></table>";
  }
  return html;
}

/**
 * Find out if user clicked an existing point and handle appropriately.
 * @param {PickedFeatures} features Feature/s that are under the point the user picked
 * @return {Bool} Whether user had clicked an existing point
 * @private
 */
Drawing.prototype._clickedExistingPoint = function(features) {
  var userClickedExistingPoint = false;

  if (features.length < 1) {
    return userClickedExistingPoint;
  }

  features.forEach(feature => {
    var index = -1;
    for (var i = 0; i < this.drawnEntities.entities.values.length; i++) {
      var pointFeature = this.drawnEntities.entities.values[i];
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

Drawing.prototype.drawHelpers = function(drawing) {
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
        drawing.drawnEntities.entities.add(
          drawing._createEntity(drawing.activeShapePoints)
        );
        drawing.floatingPoint = undefined;
        drawing.activeShapePoints = [];
        drawing.tempPointEntities.entities.removeAll();
        drawing.tempEntities.entities.removeAll();
      }
    };
    drawing.terria.leaflet.map.on("mousemove", onMouseMove, drawing);
    drawing.terria.leaflet.map.on("contextmenu", onRightClick, drawing);
    drawing.removeUpdateSubscription = function() {
      drawing.terria.leaflet.map.off("mousemove", onMouseMove, drawing);
      drawing.terria.leaflet.map.off("contextmenu", onRightClick, drawing);
    };
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
        drawing.tempEntities.entities.removeAll();

        drawing.drawnEntities.entities.add(
          drawing._createEntity(drawing.activeShapePoints)
        );
        drawing.floatingPoint = undefined;
        drawing.activeShapePoints = [];
        drawing.tempPointEntities.entities.removeAll();
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);

    drawing.removeUpdateSubscription = function() {
      handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
      handler.removeInputAction(ScreenSpaceEventType.RIGHT_CLICK);
    };
  }
};

Drawing.prototype._createTempPoint = function(position) {
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
  this.tempPointEntities.entities.add(point);
  return point;
};

Drawing.prototype._drawTempShape = function(positionData) {
  var shape;
  shape = this.tempEntities.entities.add(this._createEntity(positionData));

  return shape;
};

Drawing.prototype._createEntity = function(positionData) {
  var entity;
  var properties;
  if (this.terria.currentDrawingMode === DrawingMode.Line) {
    properties = { title: "polyline" };
    entity = new Entity({
      title: "polyline",
      polyline: new PolylineGraphics({
        positions: positionData,
        width: 5,
        material: Color.WHITE,
        clampToGround: true
      }),
      properties: properties
    });
  } else if (this.terria.currentDrawingMode === DrawingMode.Polygon) {
    properties = { title: "polygon" };
    entity = new Entity({
      title: "polygon",
      polygon: new PolygonGraphics({
        hierarchy: positionData,
        material: Color.WHITE.withAlpha(0.6)
      }),
      properties: properties
    });
  }
  entity.description = describeWithoutUnderscores(properties);
  return entity;
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

Drawing.prototype.changePointStyle = function(feature, options) {
  const entity = this.drawnEntities.entities.getById(feature.id);
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
 * @param {Object} feature Object that the represent a feature, can be changed for id
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
Drawing.prototype.updateLabel = function(feature, options) {
  const entity = this.drawnEntities.entities.getById(feature.id);
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

/**
 * Updates the entity title
 * @param {Object} feature Object that the represent a feature, can be changed for id
 * @param {String} title New title
 */
Drawing.prototype.updateTitle = function(feature, title) {
  const entity = this.drawnEntities.entities.getById(feature.id);
  if (defined(entity)) {
    entity.title = title || entity.title;
    entity.properties.title = title || entity.properties.title;
  }
  this._updateDescription(entity);
};

/**
 * Updates the description of the entity. Used in featureInfo
 * @param {Object} feature Object that the represent a entity
 * @private
 */
Drawing.prototype._updateDescription = function(entity) {
  if (defined(entity)) {
    entity.description =
      describeWithoutUnderscores(entity.properties.getValue()) ||
      entity.description;
  }
};

Drawing.prototype.zoomToEntity = function(feature) {
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
  this.terria.currentViewer.zoomTo(rectangle);
};

module.exports = Drawing;
