import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Icon from "../../Icon.jsx";
import ObserveModelMixin from "../../ObserveModelMixin";
import Styles from "./controls.scss";

const RemoveData = createReactClass({
  displayName: "RemoveData",
  mixins: [ObserveModelMixin],
  propTypes: {
    feature: PropTypes.object.isRequired,
    drawingFunction: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired
  },

  remove(item) {
    this.props.drawingFunction.removeFeature(item);
  },

  render() {
    const item = this.props.feature;
    const { t } = this.props;
    const classList = "";
    return (
      <If condition={/* item.canZoomTo */ true}>
        <li className={classNames(Styles.remove, classList)}>
          <button
            type="button"
            onClick={e => this.remove(item, e)}
            title={t("drawing.removeData")}
            className={Styles.btn}
          >
            {t("drawing.removeData")} <Icon glyph={Icon.GLYPHS.remove} />
          </button>
        </li>
      </If>
    );
  }
});
module.exports = withTranslation()(RemoveData);
