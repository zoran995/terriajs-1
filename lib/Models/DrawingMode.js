"use strict";

/**
 * Identifies the drawing mode to use.
 * @alias DrawingMode
 */

var DrawingMode = {
  /**
   * User is not in drawing mode.
   * @type {Number}
   * @constant
   */
  notDefined: -1,

  /**
   * User is drawing points.
   * @type {Number}
   * @constant
   */
  Point: 0,

  /**
   * User is drawing lines.
   * @type {Number}
   * @constant
   */
  Line: 1,

  /**
   * User is drawing polygons.
   * @type {Number}
   * @constant
   */
  Polygon: 2
};

module.exports = DrawingMode;
