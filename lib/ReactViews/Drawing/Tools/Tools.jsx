"use strict";
import createReactClass from "create-react-class";
import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
import React from "react";
import PropTypes from "prop-types";
import Styles from "./drawing-tools.scss";
const DrawingPoint = require("../../../Models/DrawingPoint");

const Point = createReactClass({
  displayName: "DrawingTools",
  mixins: [ObserveModelMixin],
  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  },
  getInitialState() {
    return {
      drawing: new DrawingPoint({
        terria: this.props.terria,
        onPointClicked: () => {},
        onPointMoved: () => {},
        onCleanUp: () => {},
        shouldRender: false
      })
    };
  },

  getTools() {
    const Points = {
      title: "Point",
      name: "Point"
    };
    return [Points];
  },

  handleClick() {
    this.state.drawing.changePointStyle();
  },
  render() {
    const tools = this.getTools();
    return (
      <div className={Styles.tabs}>
        <ul className={Styles.tabList} role="tablist">
          <For each="item" index="i" of={tools}>
            <li
              key={i}
              id={"tablist--" + item.title}
              className={Styles.tabListItem}
              role="tab"
              aria-controls={"panel--" + item.title}
            >
              <button
                type="button"
                className={Styles.btnTab}
                onClick={() => this.state.drawing.enterPointDrawMode()}
              >
                {item.name}
              </button>
            </li>
          </For>
        </ul>
        <button type="button" onClick={this.handleClick}>
          {"promjena stila"}
        </button>
      </div>
    );
  }
});
module.exports = Point;
