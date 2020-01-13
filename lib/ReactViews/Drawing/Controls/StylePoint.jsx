import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./controls.scss";

const StylePoint = createReactClass({
  displayName: "StylePoint",
  mixins: [ObserveModelMixin],
  propTypes: {
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    togglePanel: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
  },

  handleClick() {
    this.props.togglePanel();
    // this.props.drawingFunction.changePointStyle(this.props.feature, {});
  },
  render() {
    const item = this.props.feature;
    const { t } = this.props;
    const classList = "";
    return (
      <If condition={/* item.canZoomTo */ true}>
        <li className={classNames(Styles.zoom, classList)}>
          <button
            type="button"
            onClick={this.handleClick}
            title={t("drawing.style")}
            className={Styles.btn}
          >
            {t("drawing.style")}
          </button>
        </li>
      </If>
    );
  }
});
module.exports = withTranslation()(StylePoint);
