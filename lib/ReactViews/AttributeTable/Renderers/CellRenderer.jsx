"use strict";
import ObserveModelMixin from "../../ObserveModelMixin";
import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import { Cell } from "react-data-grid";
import Styles from "./renderers.scss";
import classNames from "classnames";

const CellRenderer = createReactClass({
  displayName: "CellRenderer",
  mixins: [ObserveModelMixin],
  propTypes: {
    value: PropTypes.any,
    rowData: PropTypes.object,
    column: PropTypes.object,
    isRowSelected: PropTypes.bool
  },
  contextTypes: {
    isModified: PropTypes.func,
    isProperty: PropTypes.func,
    isValid: PropTypes.func
  },
  setScrollLeft(scrollBy) {
    // if you want freeze columns to work, you need to make sure you implement this as apass through
    this.refs.cell.setScrollLeft(scrollBy);
  },
  render() {
    const className = classNames(Styles.cell, {
      [Styles.isSelected]: this.props.isRowSelected
    });

    return <Cell {...this.props} ref="cell" className={className} />;
  }
});

module.exports = CellRenderer;
