"use strict";
/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var ViewerMode = require("../Models/ViewerMode");
var CesiumDrawLineHelper = require("../Map/CesiumDrawLineHelper");
/**
 * For letting user drag existing points, altering their position without creating or destroying them. Works for all
 *
 * @alias DrawLineHelper
 * @constructor
 *
 * ViewerModes.
 * @param {Terria} terria The Terria instance.
 */
var DrawLineHelper = function(terria) {
  this._terria = terria;
  this._createDrawLinesHelper();

  var that = this;
  // It's possible to change viewerMode while mid-drawing, but in that case we need to change the drawLine helper.
  this._terria.afterViewerChanged.addEventListener(function() {
    that._createDrawLinesHelper();
    that.setUp();
  });
};

/**
 * Set up the drag point helper. Note that this might happen when a drawing exists if the user has changed viewerMode.
 */
DrawLineHelper.prototype.setUp = function(activeShapePoints, floatingPoint) {
  this._drawLinesHelper.setUp(activeShapePoints, floatingPoint);
};

/**
 * Create the draw line helper based on which viewerMode is active.
 * @private
 */
DrawLineHelper.prototype._createDrawLinesHelper = function() {
  if (defined(this._drawLinesHelper)) {
    this._drawLinesHelper.destroy();
  }
  if (this._terria.viewerMode === ViewerMode.Leaflet) {
    document
      .getElementById("cesiumContainer")
      .setAttribute("style", "cursor: crosshair");
    //this._drawLinesHelper = new LeafletDrawLineHelper(this._terria);
  } else {
    this._terria.cesium.viewer.canvas.setAttribute(
      "style",
      "cursor: crosshair"
    );
    this._drawLinesHelper = new CesiumDrawLineHelper(this._terria);
  }
};

module.exports = DrawLineHelper;
