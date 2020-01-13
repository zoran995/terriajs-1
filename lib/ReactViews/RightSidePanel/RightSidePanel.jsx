"use strict";

import React from "react";
import createReactClass from "create-react-class";
import ObserveModelMixin from "terriajs/lib/ReactViews/ObserveModelMixin";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import StoryBuilder from "../Story/StoryBuilder";
import DrawingPanel from "../Drawing/DrawingPanel";

// import Tools from "./Tools/Tools";

const RightSidePanel = createReactClass({
  displayName: "RightSidePanel",
  mixins: [ObserveModelMixin],
  propTypes: {
    drawingVisible: PropTypes.bool.isRequired,
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    storyVisible: PropTypes.bool.isRequired,
    animationDuration: PropTypes.number,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return { featureList: [] };
  },

  setFeatureList(list) {
    this.setState({
      featureList: [...list]
    });
  },

  onDismiss() {
    this.props.viewState.drawingPanelShown = false;
    this.setState({ currentTabId: undefined });
  },

  render() {
    const { t } = this.props;
    if (this.props.storyVisible) {
      return (
        <StoryBuilder
          isVisible={this.props.storyVisible}
          terria={this.props.terria}
          viewState={this.props.viewState}
          animationDuration={this.props.animationDuration}
        />
      );
    } else if (this.props.drawingVisible) {
      return (
        <DrawingPanel
          isVisible={this.props.drawingVisible}
          terria={this.props.terria}
          viewState={this.props.viewState}
          animationDuration={this.props.animationDuration}
          featureList={this.state.featureList}
          setFeatureList={this.setFeatureList}
        />
      );
    } else {
      return <div />;
    }
  }
});

module.exports = withTranslation()(RightSidePanel);
