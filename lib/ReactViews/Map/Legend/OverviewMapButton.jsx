"use strict";

import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import Icon from "../../Icon.jsx";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./legend.scss";

const OverviewMapButton = createReactClass({
  displayName: "OverviewMapButton",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired
  },

  onClick() {
    this.props.viewState.overviewMapIsVisible = !this.props.viewState
      .overviewMapIsVisible;
  },

  render() {
    return (
      <button
        type="button"
        className={Styles.overviewMap}
        onClick={this.onClick}
      >
        <div className={Styles.sectionOverview}>
          {this.props.viewState.overviewMapIsVisible ? (
            <Icon glyph={Icon.GLYPHS.overviewMapOpened} />
          ) : (
            <Icon glyph={Icon.GLYPHS.overviewMapClosed} />
          )}
        </div>
      </button>
    );
  }
});

module.exports = OverviewMapButton;
