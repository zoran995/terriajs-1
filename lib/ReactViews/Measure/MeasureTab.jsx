import ObserveModelMixin from "../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Styles from "./../measure-tool-panel.scss";
import classNames from "classnames";

const MeasureTab = createReactClass({
  displayName: "MeasureButton",
  mixins: [ObserveModelMixin],
  propTypes: {
    name: PropTypes.string.isRequired,
    panel: PropTypes.object
  },

  render() {
    return (
      <button
        type="button"
        name="Distance"
        title="distance"
        className={classNames(Styles.btn, {
          [Styles.btnSelected]: item === currentTab
        })}
      >
        Distance
      </button>
    );
  }
});

module.exports = MeasureTab;
