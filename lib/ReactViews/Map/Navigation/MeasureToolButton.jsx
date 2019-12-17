"use strict";
import React from "react";
import PropTypes from "prop-types";
import createReactClass from "create-react-class";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./tool_button.scss";
import Icon from "../../Icon.jsx";
import { withTranslation } from "react-i18next";

const MeasureToolButton = createReactClass({
  displayName: "FeedbackButton",
  mixins: [ObserveModelMixin],

  propTypes: {
    viewState: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  onClick() {
    this.props.viewState.measureToolPanelIsVisible = true;
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.toolButton}>
        <button
          type="button"
          className={Styles.btn}
          title={t("measure.measureDistance")}
          onClick={this.onClick}
        >
          <Icon glyph={Icon.GLYPHS.measure} />
        </button>
      </div>
    );
  }
});

export default withTranslation()(MeasureToolButton);
