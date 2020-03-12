"use strict";

import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./overview-map-panel.scss";
import classNames from "classnames";
import OverviewMap from "./OverviewMap.jsx";

const OverviewMapPanel = createReactClass({
  displayName: "OverviewMapPanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  componentDidMount() {
    this.escKeyListener = e => {
      if (e.keyCode === 27) {
        this.onDismiss();
      }
    };
    window.addEventListener("keydown", this.escKeyListener, true);
    this.props.viewState.rendered;
  },

  componentWillUnmount() {
    // Overviewmap form stays mounted, but leave this in to ensure it gets cleaned up if that ever changes
    window.removeEventListener("keydown", this.escKeyListener, true);
  },

  onDismiss() {
    this.setState({ isVisible: false });
    this.props.viewState.overviewMapIsVisible = false;
  },

  render() {
    const visible = this.props.viewState.overviewMapIsVisible;
    const overviewMapClassNames = classNames(Styles.form, {
      [Styles.isOpen]: this.props.viewState.overviewMapIsVisible
    });
    return (
      <div className={Styles.overviewMapContainer}>
        <div className={overviewMapClassNames}>
          {visible ? (
            <OverviewMap
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          ) : null}
        </div>
      </div>
    );
  }
});

module.exports = OverviewMapPanel;
