import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import ResultPanel from "./../ResultPanel";
import Switcher from "../Switcher";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import prettifyCoordinates from "../../../Map/prettifyCoordinates";

const CesiumMath = require("terriajs-cesium/Source/Core/Math.js").default;
const Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid.js").default;
const UserDrawing = require("../../../Models/UserDrawing");

const CoordinatePanel = createReactClass({
  displayName: "CoordinatePanel",
  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object
  },
  getInitialState() {
    return {
      currentUnitId: 0,
      coordLat: 0,
      coordLon: 0,
      units: [
        {
          id: 0,
          title: "WGS84",
          conversion: function(number) {
            return number;
          }
        },
        {
          id: 1,
          title: "GK6",
          conversion: function(number) {
            return number;
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
        shouldRender: false
      })
    };
  },
  componentDidMount() {
    this.state.userDrawing.drawPoint();
  },

  componentWillUnmount() {
    this.props.terria.mapInteractionModeStack.pop();
    this.state.userDrawing._cleanUp();
  },

  onCleanUp() {
    this.setState({ coordLat: 0, coordLon: 0 });
  },

  onPointClicked(pointEntities) {
    this.pointEntities = new CustomDataSource(
      "models.userDrawing.pointEntities"
    );
    this.updateCoordinate(pointEntities);
  },

  onPointMoved(pointEntities) {
    // This is no different to clicking a point.
    this.onPointClicked(pointEntities);
  },

  onMakeDialogMessage() {},

  updateCoordinate(pointEntities) {
    this.setState({ coordLat: 0, coordLon: 0 });
    if (pointEntities.entities.values.length <= 0) {
      return;
    }
    const point = pointEntities.entities.values[0];
    const cartesianPosition = point.position.getValue(
      this.props.terria.clock.currentTime
    );
    const catographic = Ellipsoid.WGS84.cartesianToCartographic(
      cartesianPosition
    );
    const latitude = CesiumMath.toDegrees(catographic.latitude);
    const longitude = CesiumMath.toDegrees(catographic.longitude);
    this.setState({ coordLat: latitude, coordLon: longitude });
    this.prettifyResult();
  },

  prettifyResult() {
    const pretty = prettifyCoordinates(
      this.state.coordLon,
      this.state.coordLat
    );
    this.setState({ measureResult: pretty.latitude + ", " + pretty.longitude });
  },

  toggleSelected(id) {
    this.setState({ currentUnitId: id }, function() {
      // this.prettifyNumber(this.state.totalAreaSqMetres);
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

module.exports = CoordinatePanel;
