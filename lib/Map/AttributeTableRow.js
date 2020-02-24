"use strict";

var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty")
  .default;
var CesiumMath = require("terriajs-cesium/Source/Core/Math").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties")
  .default;
var Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var PropertyBag = require("terriajs-cesium/Source/DataSources/PropertyBag")
  .default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;

var zoomRectangleFromPoint = require("../Map/zoomRectangleFromPoint");

var csv = require("../ThirdParty/csv");
/**
 * @param {String} guid unique id of feature connected with this row
 * @param {Array} properties properties of the feature connected with this row
 * @param {Array} columns list of columns available for this feature
 * @param {Object} options with following parameters
 * @param {Boolean} canZoomTo whether we should add zoomTo option for the row
 * @param {} availability wheter the entity contains availability prop
 */
var AttributeTableRow = function(
  guid,
  properties,
  columns,
  catalogItem,
  terria,
  options
) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this._guid = guid;
  this._terria = terria;
  this._catalogItem = catalogItem;

  this.setObjectProps(properties, columns);
  this.canZoomTo = defaultValue(options.canZoomTo, false);
  this._availability = options.availability;
};

defineProperties(AttributeTableRow.prototype, {
  // this is needed to support zooming to feature from attribute table
  // react-data-grid doesn't have method to return all row props, just id and current position in table
  id: {
    get: function() {
      return this._guid;
    }
  },

  guid: {
    get: function() {
      return this._guid;
    }
  },

  catalogItem: {
    get: function() {
      return this._catalogItem;
    }
  },

  availability: {
    get: function() {
      return this._availability;
    }
  }
});

AttributeTableRow.prototype.setObjectProps = function(properties, columns) {
  let sourceProperties;
  if (properties instanceof CallbackProperty) {
    sourceProperties = properties.getValue();
    properties.definitionChanged.addEventListener(function() {
      sourceProperties = properties.getValue();
    });
  } else {
    sourceProperties = properties;
  }

  for (var i = 0; i < columns.length; i++) {
    const key = columns[i].key;
    const value = columns[i].name;
    const sourceProperty = sourceProperties[value];
    if (sourceProperty !== undefined) {
      if (sourceProperties.getValue) {
        this[key] = sourceProperty.getValue();
      } else {
        this[key] = sourceProperty;
      }
    }
  }
};

AttributeTableRow.prototype._propsFromPropertyBag = function(
  properties,
  columns
) {
  for (var i = 0; i < columns.length; i++) {
    const key = columns[i].key;
    const value = columns[i].name;
    const sourceProperty = properties[value];
    if (sourceProperty !== undefined) {
      this[key] = sourceProperty.getValue();
    }
  }
};

AttributeTableRow.prototype._propsFromJSON = function(properties, columns) {
  for (var i = 0; i < columns.length; i++) {
    const key = columns[i].key;
    const value = columns[i].name;
    const sourceProperty = properties[value];
    if (sourceProperty !== undefined) {
      this[key] = sourceProperty;
    }
  }
};
/* 
AttributeTableRow.prototype.zoomToEntity = function(feature) {
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
}; */

module.exports = AttributeTableRow;
