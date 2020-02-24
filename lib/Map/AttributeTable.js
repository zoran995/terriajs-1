"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties")
  .default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var AttributeTableRow = require("./AttributeTableRow");
/**
 * @param {Object} catalogItem // catalog item connected with this attribute table
 * @param {String} guid DataSource guid
 * @param {Array} columnNames Array containing list of available attributes
 */
var AttributeTable = function(catalogItem, columns, guid, terria) {
  if (!defined(catalogItem)) {
    throw new DeveloperError("catalogItem must be defined");
  }
  if (columns.length === 0) {
    throw new DeveloperError("columnNames list can't be empty");
  }
  this._catalogItem = catalogItem;
  this._guid = guid;
  this._terria = terria;
  this._items = [];
  this.initialize(columns);
};

defineProperties(AttributeTable.prototype, {
  /**
   * Gets or sets the columns for dataset attribute table.
   * @memberOf AttributeTable.prototype
   * @type {String[]}
   */
  columns: {
    get: function() {
      return this._columns;
    }
  },

  canZoomTo: {
    get: function() {
      return defined(this._guid);
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
  items: {
    get: function() {
      return this._items;
    }
  }
});

AttributeTable.prototype.initialize = function(columns) {
  this.setColumns(columns, this);
  if (defined(this.catalogItem.dataSource)) {
    this.loadFromPropertyBag(this.catalogItem.dataSource.entities.values);
  } else if (defined(this.catalogItem.regionMapping)) {
  }
};

AttributeTable.prototype.updateTable = function() {
  if (defined(this.catalogItem.dataSource)) {
    this.loadFromPropertyBag(this.catalogItem.dataSource.entities.values);
  } else if (defined(this.catalogItem.regionMapping)) {
  }
};

AttributeTable.prototype.setColumns = function(columns, result) {
  var cn = [];
  columns.map((column, index) => {
    cn.push({
      key: column.name ? createKey(column.name) : createKey(column),
      name: column.name ? column.name : column,
      type: column.type
    });
  });
  result._columns = cn;
};

AttributeTable.fromPropertyBag = function(features, result) {
  if (!defined(features) || features.length === 0) {
    return;
  }
  if (!defined(result)) {
    result = this;
  }
  var data = features.map(
    (row, index) =>
      new AttributeTableRow(
        row.id,
        row.properties,
        result.columns,
        result.catalogItem,
        result._terria,
        { availability: row.availability }
      )
  );
  result._items = data;
  return result;
};

AttributeTable.prototype.loadFromPropertyBag = function(propertyBag) {
  return AttributeTable.fromPropertyBag(propertyBag, this);
};

AttributeTable.prototype.loadFromTableStructure = function(tableStructure) {
  return AttributeTable.fromTableStructure(tableStructure, this);
};

function createKey(string) {
  if (typeof string === "string" || string instanceof String) {
    return string
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
  }
  return string;
}

module.exports = AttributeTable;
