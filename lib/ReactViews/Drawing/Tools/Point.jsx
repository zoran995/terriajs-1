"use strict";
import createReactClass from "create-react-class";
import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Styles from "./Point.scss";
import { sortable } from "react-anything-sortable";
import { withTranslation } from "react-i18next";
import Icon from "../../Icon.jsx";
import StylePoint from "../Controls/StylePoint";
import TextData from "../Controls/TextData";
import ZoomToData from "../Controls/ZoomToData";
import RemoveData from "../Controls/RemoveData";
import StylePointPanel from "../StylePanels/StylePointPanel";
import StyleLabelPanel from "../StylePanels/StyleLabelPanel";

const Point = createReactClass({
  displayName: "PointDrawTool",
  mixins: [ObserveModelMixin],
  propTypes: {
    className: PropTypes.string,
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      toolsVisible: this.props.feature.isToolVisible,
      featureVisible: true,
      showStylePanel: false,
      showLabelPanel: false
    };
  },

  toggleDisplay() {
    this.props.feature.isToolVisible = !this.props.feature.isToolVisible;
    this.forceUpdate();
  },

  toggleVisibility() {
    this.props.drawingFunction.toggleFeatureVisibility(
      this.props.feature,
      !this.state.featureVisible
    );
    this.setState(state => ({
      featureVisible: !state.featureVisible
    }));
  },

  toggleStylePanel() {
    this.setState({
      showStylePanel: !this.state.showStylePanel
    });
  },

  toggleLabelPanel() {
    this.setState({
      showLabelPanel: !this.state.showLabelPanel
    });
  },
  render() {
    const { t } = this.props;
    const feature = this.props.feature;
    return (
      <div>
        {this.state.showStylePanel ? (
          <StylePointPanel
            closePanel={this.toggleStylePanel}
            feature={this.props.feature}
            drawingFunction={this.props.drawingFunction}
          />
        ) : null}
        {this.state.showLabelPanel ? (
          <StyleLabelPanel
            closePanel={this.toggleLabelPanel}
            feature={this.props.feature}
            drawingFunction={this.props.drawingFunction}
          />
        ) : null}
        <li
          className={classNames(this.props.className, Styles.featureItem, {
            [Styles.isOpen]: true
          })}
        >
          <ul className={Styles.header}>
            <If condition={/* feature.supportsToggleShown */ true}>
              <li className={Styles.visibilityColumn}>
                <button
                  type="button"
                  onClick={this.toggleVisibility}
                  title={t("workbench.toggleVisibility")}
                  className={Styles.btnVisibility}
                >
                  {this.state.featureVisible ? (
                    <Icon glyph={Icon.GLYPHS.checkboxOn} />
                  ) : (
                    <Icon glyph={Icon.GLYPHS.checkboxOff} />
                  )}
                </button>
              </li>
            </If>
            <li className={Styles.nameColumn}>
              <div
                // onMouseDown={this.props.onMouseDown}
                // onTouchStart={this.props.onTouchStart}
                className={Styles.draggable}
                title={feature.title}
              >
                {feature.title}
              </div>
            </li>
            <li className={Styles.toggleColumn}>
              <button
                type="button"
                className={Styles.btnToggle}
                onClick={this.toggleDisplay}
              >
                {this.props.feature.isToolVisible ? (
                  <Icon glyph={Icon.GLYPHS.opened} />
                ) : (
                  <Icon glyph={Icon.GLYPHS.closed} />
                )}
              </button>
            </li>
            <li className={Styles.headerClearfix} />
          </ul>
          <If condition={this.props.feature.isToolVisible}>
            <div className={Styles.inner}>
              <ul className={Styles.control}>
                <ZoomToData
                  feature={feature}
                  drawingFunction={this.props.drawingFunction}
                />
                <span className={Styles.separator} />
                <TextData
                  feature={feature}
                  drawingFunction={this.props.drawingFunction}
                  togglePanel={this.toggleLabelPanel}
                />
                <span className={Styles.separator} />
                <StylePoint
                  feature={feature}
                  drawingFunction={this.props.drawingFunction}
                  togglePanel={this.toggleStylePanel}
                />
                <span className={Styles.separator} />
                <RemoveData
                  feature={feature}
                  drawingFunction={this.props.drawingFunction}
                />
              </ul>
            </div>
          </If>
        </li>
      </div>
    );
  }
});
module.exports = sortable(withTranslation()(Point));
