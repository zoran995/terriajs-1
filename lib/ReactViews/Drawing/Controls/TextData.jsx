import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./controls.scss";

const TextData = createReactClass({
  displayName: "ViewingControls",
  mixins: [ObserveModelMixin],
  propTypes: {
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    togglePanel: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  },

  handleClick() {
    this.props.togglePanel();
  },

  render() {
    const { t } = this.props;
    const classList = "";
    return (
      <If condition={true}>
        <li className={classNames(Styles.zoom, classList)}>
          <button
            type="button"
            onClick={this.handleClick}
            title={t("drawing.text")}
            className={Styles.btn}
          >
            {t("drawing.text")}
          </button>
        </li>
      </If>
    );
  }
});
module.exports = withTranslation()(TextData);
