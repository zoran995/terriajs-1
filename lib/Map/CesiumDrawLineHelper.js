"use strict";
/*global require*/

import Entity from "terriajs-cesium/Source/DataSources/Entity.js";
var CallbackProperty = require("terriajs-cesium/Source/DataSources/CallbackProperty");
var Color = require("terriajs-cesium/Source/Core/Color").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var ScreenSpaceEventHandler = require("terriajs-cesium/Source/Core/ScreenSpaceEventHandler")
  .default;
var ScreenSpaceEventType = require("terriajs-cesium/Source/Core/ScreenSpaceEventType")
  .default;
var CustomDataSource = require("terriajs-cesium/Source/DataSources/CustomDataSource")
  .default;

/**
 * Callback for when a point is moved.
 * @callback MouseMovedCallback
 * @param {CustomDataSource} customDataSource Contains all point entities that user has selected so far
 */

/**
 * For letting user draw lines in Cesium ViewerModes only.
 *
 * @alias CesiumDrawLineHelper
 * @constructor
 *
 * @param {Terria} terria The Terria instance.
 * @param {MouseMovedCallback} mouseMovedCallback A function that is called when a mouse is moved.
 */

var CesiumDrawLineHelper = function(terria, tempLine) {
  this._terria = terria;
  this._setUp = false;
  this.type = "Cesium";

  this._drawnEntities = this._terria.drawnEntities;

  /**
   * List of point entities constructing the line, which is populated with
   * user-created points only for the current line.
   * @type {CustomDataSource}
   */
  this._pointEntities = new CustomDataSource();

  this._tempLine = tempLine;
  /**
   * Whether user is currently drawing line.
   * @type {Bool}
   */
  this._inDrawingMode = false;
};

/**
 * Set up the draw line helper so that attempting to drag a line will create drawing effect.
 */
CesiumDrawLineHelper.prototype.setUp = function(
  activeShapePoints,
  floatingPoint
) {
  if (this._setUp) {
    return;
  }
  if (
    !defined(this._terria.cesium) ||
    !defined(this._terria.cesium.scene) ||
    !defined(this._terria.cesium.viewer)
  ) {
    // Test context or something has gone *so* badly wrong
    return;
  }
  this._viewer = this._terria.cesium.viewer;
  this._viewer.canvas.setAttribute("style", "cursor: crosshair");
  var that = this;

  const handler = new ScreenSpaceEventHandler(that._viewer.scene.canvas, false);
  console.log(handler);

  this._setUp = true;
};

module.exports = CesiumDrawLineHelper;
