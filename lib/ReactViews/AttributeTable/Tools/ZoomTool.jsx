import React from "react";
import ToolRenderer from "../Renderers/ToolRenderer";
import zoomToEntity from "../../../Map/zoomToEntity";
import defined from "terriajs-cesium/Source/Core/defined";
import Icon from "../../Icon.jsx";

module.exports = function(dataSource, terria) {
  if (!defined(dataSource) || !defined(terria)) {
    return;
  }
  return {
    key: "zoomTo",
    name: "",
    type: undefined,
    frozen: true,
    editable: false,
    sortable: false,
    resizable: false,
    filterable: false,
    width: 35,
    events: {
      onClick: (ev, target) => {
        zoomToEntity(dataSource.entities.getById(target.rowId), terria);
      }
    },
    formatter: <ToolRenderer icon={Icon.GLYPHS.zoomTo} />
  };
};
