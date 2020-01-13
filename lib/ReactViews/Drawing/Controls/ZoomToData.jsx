import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./controls.scss";

const ZoomToData = createReactClass({
  displayName: "ZoomToData",
  mixins: [ObserveModelMixin],
  propTypes: {
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  zoomTo() {
    this.props.drawingFunction.zoomToEntity(this.props.feature);
  },

  render() {
    const { t } = this.props;
    const classList = "";
    return (
      <If condition={/* item.canZoomTo */ true}>
        <li className={classNames(Styles.zoom, classList)}>
          <button
            type="button"
            onClick={this.zoomTo}
            title={t("drawing.zoomTo")}
            className={Styles.btn}
          >
            {t("drawing.zoomTo")}
          </button>
        </li>
      </If>
    );
  }
});
module.exports = withTranslation()(ZoomToData);
