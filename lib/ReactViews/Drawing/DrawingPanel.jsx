"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import Sortable from "react-anything-sortable";
import { withTranslation } from "react-i18next";
import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
import BadgeBar from "../BadgeBar.jsx";
import Icon from "../Icon.jsx";
import Styles from "./drawing-panel.scss";
import Point from "./Tools/Point";
import DrawingMode from "../../Models/DrawingMode";
import Drawing from "../../Models/Drawing";
import DrawDataCatalogItem from "../../Models/DrawDataCatalogItem";

const DrawingPanel = createReactClass({
  displayName: "DrawingPanel",
  mixins: [ObserveModelMixin],
  propTypes: {
    isVisible: PropTypes.bool.isRequired,
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    featureList: PropTypes.array.isRequired,
    setFeatureList: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  },
  getInitialState() {
    const that = this;
    this.drawing = new Drawing({ terria: this.props.terria });
    this.props.terria.drawnEntities.entities.collectionChanged.addEventListener(
      that.onChanged
    );
    return {};
  },
  componentDidMount() {
    this._marker = new DrawDataCatalogItem(this.props.terria);
  },

  onChanged(collection, added, removed, changed) {
    this.props.setFeatureList(collection.values);
  },

  onDismiss() {
    this.props.viewState.drawingPanelShown = false;
  },

  selectDrawingMode(drawingMode, event) {
    this._marker.name = "location.myLocation";
    this._marker.dataSource = this.props.terria.drawnEntities;

    this._marker.load();
    if (this._marker.isEnabled !== true) {
      this._marker.isEnabled = true;
    }
    event.stopPropagation();
    let newDrawingMode;
    switch (drawingMode) {
      case 0:
        newDrawingMode = DrawingMode.Point;
        break;
      case 1:
        newDrawingMode = DrawingMode.Line;
        break;
      case 2:
        newDrawingMode = DrawingMode.Polygon;
        break;
      default:
        newDrawingMode = DrawingMode.notDefined;
        break;
    }
    this.props.terria.currentDrawingMode = newDrawingMode;
  },

  removeAllFeatures() {
    this.drawing.removeAll();
  },

  renderData() {
    const { t } = this.props;
    const className = classNames({
      [Styles.stories]: true,
      [Styles.isActive]: false
    });

    return (
      <div className={className}>
        <BadgeBar
          label={t("drawing.badgeLabel")}
          badge={this.props.featureList.length}
        >
          <button
            type="button"
            onClick={this.removeAllFeatures}
            className={Styles.removeButton}
          >
            {t("story.removeAllStories")} <Icon glyph={Icon.GLYPHS.remove} />
          </button>
        </BadgeBar>
        <ul className={Styles.dataContent}>
          <Sortable onSort={this.onSort} direction="vertical" dynamic={true}>
            <For each="feature" index="index" of={this.props.featureList}>
              <Point
                feature={feature}
                drawingFunction={this.drawing}
                key={feature.id}
              />
            </For>
          </Sortable>
        </ul>
      </div>
    );
  },

  getDrawingModes() {
    const drawingModeLabels = {
      [DrawingMode.Point]: "Point",
      [DrawingMode.Line]: "Line",
      [DrawingMode.Polygon]: "Polygon"
    };
    const point = {
      id: DrawingMode.Point,
      title: drawingModeLabels[DrawingMode.Point],
      icon: "",
      isActive: false
    };
    const line = {
      id: DrawingMode.Line,
      title: drawingModeLabels[DrawingMode.Line],
      icon: "",
      isActive: false
    };
    const polygon = {
      id: DrawingMode.Polygon,
      title: drawingModeLabels[DrawingMode.Polygon],
      icon: "",
      isActive: false
    };
    return [point, line, polygon];
  },

  render() {
    const drawingModeLabels = {
      [DrawingMode.Point]: "Point",
      [DrawingMode.Line]: "Line",
      [DrawingMode.Polygon]: "Polygon"
    };
    const drawingModeIcons = {
      [DrawingMode.Point]: "",
      [DrawingMode.Line]: "",
      [DrawingMode.Polygon]: ""
    };
    const drawingModes = [
      DrawingMode.Point,
      DrawingMode.Line,
      DrawingMode.Polygon
    ];
    const { t } = this.props;
    const className = classNames({
      [Styles.drawingPanel]: true,
      [Styles.isVisible]: this.props.isVisible,
      [Styles.isHidden]: !this.props.isVisible
    });
    const that = this;
    return (
      <div className={className}>
        <div>
          <ul className={Styles.title}>
            <li>{t("drawing.title")}</li>
            <li>
              <button
                type="button"
                aria-label={t("story.hideStoryPanel")}
                onClick={this.onDismiss}
                className={Styles.hideButton}
                title={t("story.hideStoryPanel")}
              >
                <Icon glyph={Icon.GLYPHS.right} />
              </button>
            </li>
          </ul>
        </div>
        <div>
          <ul className={Styles.toolsList} role="tablist">
            <For each="drawingMode" index="i" of={drawingModes}>
              <li
                key={drawingMode}
                className={Styles.toolsListItem}
                role="tab"
                aria-selected={this.drawing.currentDrawingMode === drawingMode}
              >
                <button
                  type="button"
                  onClick={that.selectDrawingMode.bind(this, drawingMode)}
                  className={classNames(Styles.btnTool, {
                    [Styles.toolSelected]:
                      this.drawing.currentDrawingMode === drawingMode
                  })}
                  title={drawingModeLabels[drawingMode]}
                >
                  {/* <Icon glyph={drawingModeIcons[drawingMode]} /> */}
                  {drawingModeLabels[drawingMode]}
                </button>
              </li>
            </For>
          </ul>
        </div>
        {this.renderData()}
      </div>
    );
  }
});

module.exports = withTranslation()(DrawingPanel);
