import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import ResultPanel from "./../ResultPanel";
import Switcher from "../Switcher";
const UserDrawing = require("../../../Models/UserDrawing");

const EllipsoidGeodesic = require("terriajs-cesium/Source/Core/EllipsoidGeodesic.js")
  .default;
const Ellipsoid = require("terriajs-cesium/Source/Core/Ellipsoid.js").default;

const DistancePanel = createReactClass({
  displayName: "DistancePanel",
  propTypes: {
    terria: PropTypes.object,
    viewState: PropTypes.object
  },

  getInitialState() {
    return {
      currentUnitId: 0,
      totalDistanceMetres: 0,
      units: [
        {
          id: 0,
          title: "Meter",
          label: "m",
          conversion: function(number) {
            return number;
          }
        },
        {
          id: 1,
          title: "Kilometer",
          label: "km",
          conversion: function(number) {
            return number / 1000.0;
          }
        },
        {
          id: 2,
          title: "Miles",
          label: "mi",
          conversion: function(number) {
            return number * 0.000621371192;
          }
        }
      ],
      measureResult: "",
      userDrawing: new UserDrawing({
        terria: this.props.terria,
        messageHeader: "",
        allowPolygon: false,
        onPointClicked: this.onPointClicked,
        onPointMoved: this.onPointMoved,
        onCleanUp: this.onCleanUp,
        onMakeDialogMessage: this.onMakeDialogMessage,
        shouldRender: false
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
    this.setState({ totalDistanceMetres: 0 });
  },

  onPointClicked(pointEntities) {
    this.updateDistance(pointEntities);
  },

  onPointMoved(pointEntities) {
    // This is no different to clicking a point.
    this.onPointClicked(pointEntities);
  },

  onMakeDialogMessage() {
    const distance = this.prettifyNumber(this.state.totalDistanceMetres);
    return distance;
  },

  prettifyNumber(number) {
    if (number <= 0) {
      return "";
    }
    const label = this.state.units[this.state.currentUnitId].label;
    number = this.state.units[this.state.currentUnitId].conversion(number);
    number = number.toFixed(2);
    number = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    this.setState({ measureResult: number + " " + label });
    return this.state.measureResult;
  },

  updateDistance(pointEntities) {
    this.setState({ totalDistanceMetres: 0 });
    if (pointEntities.entities.values.length < 1) {
      return;
    }

    const prevPoint = pointEntities.entities.values[0];
    let prevPointPos = prevPoint.position.getValue(
      this.props.terria.clock.currentTime
    );
    for (let i = 1; i < pointEntities.entities.values.length; i++) {
      const currentPoint = pointEntities.entities.values[i];
      const currentPointPos = currentPoint.position.getValue(
        this.props.terria.clock.currentTime
      );

      this.setState({
        totalDistanceMetres:
          this.state.totalDistanceMetres +
          this.getGeodesicDistance(prevPointPos, currentPointPos)
      });

      prevPointPos = currentPointPos;
    }
    if (this.state.userDrawing.closeLoop) {
      const firstPoint = pointEntities.entities.values[0];
      const firstPointPos = firstPoint.position.getValue(
        this.props.terria.clock.currentTime
      );
      this.setState({
        totalDistanceMetres:
          this.state.totalDistanceMetres +
          this.getGeodesicDistance(prevPointPos, firstPointPos)
      });
    }
  },

  getGeodesicDistance(pointOne, pointTwo) {
    // Note that Cartesian.distance gives the straight line distance between the two points, ignoring
    // curvature. This is not what we want.
    const pickedPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(
      pointOne
    );
    const lastPointCartographic = Ellipsoid.WGS84.cartesianToCartographic(
      pointTwo
    );
    const geodesic = new EllipsoidGeodesic(
      pickedPointCartographic,
      lastPointCartographic
    );
    return geodesic.surfaceDistance;
  },

  toggleSelected(id) {
    this.setState({ currentUnitId: id }, function() {
      this.prettifyNumber(this.state.totalDistanceMetres);
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

module.exports = DistancePanel;
