"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./measure-tool-panel.scss";
import Tabs from "./Tabs";

const MeasureToolPanel = createReactClass({
  displayName: "MeasureToolPanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      currentTabId: undefined
    };
  },

  activateTab(index) {
    this.setState({ currentTabId: index });
    // this.state.userDrawing.enterDrawMode();
  },

  componentDidMount() {
    this.escKeyListener = e => {
      if (e.keyCode === 27) {
        this.onDismiss();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
  },

  componentWillUnmount() {
    // Feedback form stays mounted, but leave this in to ensure it gets cleaned up if that ever changes
    window.removeEventListener("keydown", this.escKeyListener, true);
  },

  onDismiss() {
    this.props.viewState.measureToolPanelIsVisible = false;
    this.setState({ currentTabId: undefined });
  },

  render() {
    const { t } = this.props;
    const measureToolPanelClassNames = classNames(Styles.panel, {
      [Styles.isOpen]: this.props.viewState.measureToolPanelIsVisible
    });

    return (
      <div>
        <div className={measureToolPanelClassNames}>
          <div className={Styles.header}>
            <h4 className={Styles.title}>Measure</h4>
            <button
              className={Styles.btnClose}
              onClick={this.onDismiss}
              title="Close"
            >
              <Icon glyph={Icon.GLYPHS.close} />
            </button>
          </div>
          <div className={Styles.innerPanel}>
            <Tabs
              terria={this.props.terria}
              viewState={this.props.viewState}
              currentTabId={this.state.currentTabId}
              activateTab={this.activateTab}
            />
          </div>
        </div>
      </div>
    );
  }
});

module.exports = withTranslation()(MeasureToolPanel);
