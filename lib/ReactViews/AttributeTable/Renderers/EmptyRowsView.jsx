import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import Styles from "./renderers.scss";
import { withTranslation } from "react-i18next";

const EmptyRowsView = createReactClass({
  propTypes: {
    message: PropTypes.string,
    t: PropTypes.func.isRequired
  },

  render() {
    const { t } = this.props;
    return (
      <div className={Styles.emptyView}>
        <span>
          {this.props.message
            ? this.props.message
            : t("attributeTable.noDataAvailable")}
        </span>
      </div>
    );
  }
});

module.exports = withTranslation()(EmptyRowsView);
