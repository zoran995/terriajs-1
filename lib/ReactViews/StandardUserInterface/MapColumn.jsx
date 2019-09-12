import React from "react";
import debounce from "lodash.debounce";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import "mutationobserver-shim";

import TerriaViewerWrapper from "../Map/TerriaViewerWrapper.jsx";
import LocationBar from "../Map/Legend/LocationBar.jsx";
import DistanceLegend from "../Map/Legend/DistanceLegend.jsx";
import FeedbackButton from "../Feedback/FeedbackButton.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import BottomDock from "../BottomDock/BottomDock.jsx";
import defined from "terriajs-cesium/Source/Core/defined";
import FeatureDetection from "terriajs-cesium/Source/Core/FeatureDetection";
import classNames from "classnames";

import Styles from "./map-column.scss";

const isIE =
  FeatureDetection.isInternetExplorer() || FeatureDetection.isChrome();

/**
 * Right-hand column that contains the map, controls that sit over the map and sometimes the bottom dock containing
 * the timeline and charts.
 *
 * Note that because IE9-11 is terrible the pure-CSS layout that is used in nice browsers doesn't work, so for IE only
 * we use a (usually polyfilled) MutationObserver to watch the bottom dock and resize when it changes.
 */
const MapColumn = createReactClass({
  displayName: "MapColumn",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    customFeedbacks: PropTypes.array.isRequired
  },

  getInitialState() {
    return {};
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    if (isIE) {
      this.observer = new MutationObserver(this.resizeMapCell);
      window.addEventListener("resize", this.resizeMapCell, false);
    }
  },

  addBottomDock(bottomDock) {
    if (isIE) {
      this.bottomDock = bottomDock;
      this.observer.observe(bottomDock, {
        childList: true,
        subtree: true
      });
      this.resizeMapCell();
    }
  },

  newMapInner(mapInner) {
    if (isIE) {
      this.mapInner = mapInner;

      this.resizeMapCell();
    }
  },

  newMapCell(mapCell) {
    if (isIE) {
      this.mapCell = mapCell;

      this.resizeMapCell();
    }
  },

  resizeMapCell() {
    if (this.mapInner) {
      const dockHeight = (this.bottomDock && this.bottomDock.offsetHeight) || 0;
      const heightToSet =
        dockHeight === 0 ? "100%" : `calc(100% - ${dockHeight}px)`;
      this.setState({
        height: heightToSet
      });
    }
  },
  resizeMapCellWithDebounce() {
    return debounce(this.resizeMapCell, 200);
  },

  componentWillUnmount() {
    if (isIE) {
      window.removeEventListener(
        "resize",
        this.resizeMapCellWithDebounce,
        false
      );
      this.observer.disconnect();
    }
  },

  render() {
    const mapWrapperHeight = isIE ? this.state.height : undefined;
    return (
      <div className={Styles.mapInner} ref={this.newMapInner}>
        <div className={Styles.mapRow} style={{ height: mapWrapperHeight }}>
          <div
            className={classNames(Styles.mapCell, Styles.mapCellMap)}
            ref={this.newMapCell}
          >
            <div className={Styles.mapWrapper}>
              <TerriaViewerWrapper
                terria={this.props.terria}
                viewState={this.props.viewState}
              />
            </div>
            <If condition={!this.props.viewState.hideMapUi()}>
              <div className={Styles.locationDistance}>
                <LocationBar
                  terria={this.props.terria}
                  mouseCoords={this.props.viewState.mouseCoords}
                />
                <DistanceLegend terria={this.props.terria} />
              </div>
            </If>
            <If
              condition={
                !this.props.customFeedbacks.length &&
                this.props.terria.configParameters.feedbackUrl &&
                !this.props.viewState.hideMapUi()
              }
            >
              <div
                className={classNames(Styles.feedbackButtonWrapper, {
                  [Styles.withTimeSeriesControls]: defined(
                    this.props.terria.timeSeriesStack.topLayer
                  )
                })}
              >
                <FeedbackButton viewState={this.props.viewState} />
              </div>
            </If>

            <If
              condition={
                this.props.customFeedbacks.length &&
                this.props.terria.configParameters.feedbackUrl &&
                !this.props.viewState.hideMapUi()
              }
            >
              <For
                each="feedbackItem"
                of={this.props.customFeedbacks}
                index="i"
              >
                <div key={i}>{feedbackItem}</div>
              </For>
            </If>
          </div>
          <If condition={this.props.terria.configParameters.printDisclaimer}>
            <div className={classNames(Styles.mapCell, "print")}>
              <a
                className={Styles.printDisclaimer}
                href={this.props.terria.configParameters.printDisclaimer.url}
              >
                {this.props.terria.configParameters.printDisclaimer.text}
              </a>
            </div>
          </If>
        </div>
        <If condition={!this.props.viewState.hideMapUi()}>
          <div className={Styles.mapRow}>
            <div className={Styles.mapCell}>
              <BottomDock
                terria={this.props.terria}
                viewState={this.props.viewState}
                domElementRef={this.addBottomDock}
              />
            </div>
          </div>
        </If>
      </div>
    );
  }
});

export default MapColumn;
