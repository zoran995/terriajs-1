"use strict";
import ObserveModelMixin from "../../ObserveModelMixin";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import cellRenderer from "./CellRenderer";
import Styles from "./renderers.scss";

const RowRenderer = createReactClass({
  displayName: "RowRenderer",
  mixins: [ObserveModelMixin],
  propTypes: {
    columns: PropTypes.array,
    row: PropTypes.object,
    renderBaseRow: PropTypes.func.isRequired
  },
  setScrollLeft(scrollBy) {
    // if you want freeze columns to work, you need to make sure you implement this as apass through
    this.refs.row.setScrollLeft(scrollBy);
  },
  render() {
    const className = Styles.row;
    return this.props.renderBaseRow({
      extraClasses: [className],
      cellRenderer: cellRenderer,
      ...this.props
    });
  }
});
module.exports = RowRenderer;
