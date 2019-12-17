import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import ResultPanel from "./../ResultPanel";
import Switcher from "../Switcher";
import Color from "terriajs-cesium/Source/Core/Color";

const UserDrawing = require("../../../Models/UserDrawing");
const Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid.js").default;
const EllipsoidTangentPlane = require("terriajs-cesium/Source/Core/EllipsoidTangentPlane.js")
  .default;
const CesiumMath = require("terriajs-cesium/Source/Core/Math.js").default;
const PolygonGeometryLibrary = require("terriajs-cesium/Source/Core/PolygonGeometryLibrary.js")
  .default;
const PolygonHierarchy = require("terriajs-cesium/Source/Core/PolygonHierarchy.js")
  .default;
const Cartesian3 = require("terriajs-cesium/Source/Core/Cartesian3.js").default;
const VertexFormat = require("terriajs-cesium/Source/Core/VertexFormat.js")
  .default;

const AreaPanel = createReactClass({
  displayName: "AreaPanel",

  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object
  },

  getInitialState() {
    return {
      currentUnitId: 0,
      totalAreaSqMetres: 0,
      units: [
        {
          id: 0,
          title: "Sq meters",
          label: "m\u00B2",
          conversion: function(number) {
            return number;
          }
        },
        {
          id: 1,
          title: "Sq kilometers",
          label: "km\u00B2",
          conversion: function(number) {
            return number / 1e6;
          }
        },
        {
          id: 2,
          title: "Ares",
          label: "a",
          conversion: function(number) {
            return number / 100;
          }
        },
        {
          id: 3,
          title: "Hectares",
          label: "ha",
          conversion: function(number) {
            return number / 10000;
          }
        }
      ],
      measureResult: "",
      userDrawing: new UserDrawing({
        terria: this.props.terria,
        messageHeader: "measure.measureTool",
        allowPolygon: true,
        onPointClicked: this.onPointClicked,
        onPointMoved: this.onPointMoved,
        onCleanUp: this.onCleanUp,
        onMakeDialogMessage: this.onMakeDialogMessage,
        shouldRender: false,
        lineColor: new Color(0, 1, 0, 1)
      })
    };
  },

  componentDidMount() {
    this.state.userDrawing.enterDrawMode();
  },

  componentWillUnmount() {
    this.props.terria.mapInteractionModeStack.pop();
    this.state.userDrawing._cleanUp();
  },

  onCleanUp() {
    this.setState({ totalAreaSqMetres: 0 });
  },

  onPointClicked(pointEntities) {
    this.updateArea(pointEntities);
  },

  onPointMoved(pointEntities) {
    // This is no different to clicking a point.
    this.onPointClicked(pointEntities);
  },

  onMakeDialogMessage() {
    const area = this.prettifyNumber(this.state.totalAreaSqMetres);
    return area;
  },

  prettifyNumber(number) {
    if (number <= 0) {
      return "";
    }
    const label = this.state.units[this.state.currentUnitId].label;
    number = this.state.units[this.state.currentUnitId].conversion(number);
    number = number.toFixed(2);
    number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    this.setState({ measureResult: number + " " + label });
    return this.state.measureResult;
  },

  updateArea(pointEntities) {
    this.setState({ totalAreaSqMetres: 0 });
    if (!this.state.userDrawing.closeLoop) {
      // Not a closed polygon? Don't calculate area.
      return;
    }
    if (pointEntities.entities.values.length < 3) {
      return;
    }
    const perPositionHeight = true;

    const positions = [];
    for (let i = 0; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position.getValue(
        this.props.terria.clock.currentTime
      );
      positions.push(currentPointPos);
    }

    // Request the triangles that make up the polygon from Cesium.
    const tangentPlane = EllipsoidTangentPlane.fromPoints(
      positions,
      Ellipsoid.WGS84
    );
    const polygons = PolygonGeometryLibrary.polygonsFromHierarchy(
      new PolygonHierarchy(positions),
      tangentPlane.projectPointsOntoPlane.bind(tangentPlane),
      !perPositionHeight,
      Ellipsoid.WGS84
    );

    const geom = PolygonGeometryLibrary.createGeometryFromPositions(
      Ellipsoid.WGS84,
      polygons.polygons[0],
      CesiumMath.RADIANS_PER_DEGREE,
      perPositionHeight,
      VertexFormat.POSITION_ONLY
    );

    if (
      geom.indices.length % 3 !== 0 ||
      geom.attributes.position.values.length % 3 !== 0
    ) {
      // Something has gone wrong. We expect triangles. Can't calcuate area.
      return;
    }

    const coords = [];
    for (let i = 0; i < geom.attributes.position.values.length; i += 3) {
      coords.push(
        new Cartesian3(
          geom.attributes.position.values[i],
          geom.attributes.position.values[i + 1],
          geom.attributes.position.values[i + 2]
        )
      );
    }
    let area = 0;
    for (let i = 0; i < geom.indices.length; i += 3) {
      const ind1 = geom.indices[i];
      const ind2 = geom.indices[i + 1];
      const ind3 = geom.indices[i + 2];

      const a = Cartesian3.distance(coords[ind1], coords[ind2]);
      const b = Cartesian3.distance(coords[ind2], coords[ind3]);
      const c = Cartesian3.distance(coords[ind3], coords[ind1]);

      // Heron's formula
      const s = (a + b + c) / 2.0;
      area += Math.sqrt(s * (s - a) * (s - b) * (s - c));
    }

    this.setState({ totalAreaSqMetres: area });
  },

  toggleSelected(id) {
    this.setState({ currentUnitId: id }, function() {
      this.prettifyNumber(this.state.totalAreaSqMetres);
    });
  },

  render() {
    return (
      <div>
        <Switcher
          units={this.state.units}
          currentUnitId={this.state.currentUnitId}
          toggleItem={this.toggleSelected}
        />
        <ResultPanel result={this.state.measureResult} />
      </div>
    );
  }
});

module.exports = AreaPanel;
