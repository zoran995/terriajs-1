"use strict";

/*global require*/
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties")
  .default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var DataSourceCatalogItem = require("./DataSourceCatalogItem");
var formatPropertyValue = require("../Core/formatPropertyValue");
var inherit = require("../Core/inherit");
var Metadata = require("./Metadata");

var i18next = require("i18next").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var DrawingMode = require("./DrawingMode");

/**
 * A {@link CatalogItem} representing user created data.
 *
 * @alias DrawDataCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var DrawDataCatalogItem = function(terria, dataSource) {
  DataSourceCatalogItem.call(this, terria);
  this._dataSource = dataSource;

  knockout.getObservable(this, "isEnabled").subscribe(function() {
    if (!this.isEnabled) this._dataSource.entities.removeAll();
    terria.currentDrawingMode = DrawingMode.notDefined;
  }, this);
};

inherit(DataSourceCatalogItem, DrawDataCatalogItem);

defineProperties(DrawDataCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf GeoJsonCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "userCreatedData";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'GeoJSON'.
   * @memberOf GeoJsonCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.geoJson.name");
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf GeoJsonCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      // TODO: maybe return the FeatureCollection's properties?
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage = i18next.t(
        "models.geoJson.dataSourceErrorMessage"
      );
      result.serviceErrorMessage = i18next.t(
        "models.geoJson.serviceErrorMessage"
      );
      return result;
    }
  },
  /**
   * Gets the data source associated with this catalog item.
   * @memberOf GeoJsonCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      return this._dataSource;
    },
    set: function(dataSource) {
      this._dataSource = dataSource;
    }
  }
});

var simpleStyleIdentifiers = [
  "title",
  "description", //
  "marker-size",
  "marker-symbol",
  "marker-color",
  "stroke", //
  "stroke-opacity",
  "stroke-width",
  "fill",
  "fill-opacity"
];

module.exports = DrawDataCatalogItem;
