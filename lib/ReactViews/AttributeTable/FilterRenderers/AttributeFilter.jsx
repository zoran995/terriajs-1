import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import Styles from "./filter.scss";

const AttributeFilter = props => {
  const renderInput = () => {
    if (props.column.filterable === false) {
      return <span />;
    }
    const placeholder = "Search";
    const inputKey = "header-filter-" + props.column.key;
    return (
      <input
        disabled={props.disabled}
        key={inputKey}
        type="text"
        className={Styles.filterInput}
        placeholder={placeholder}
        onChange={props.handleChange ? props.handleChange : handleChange}
      />
    );
  };
  const handleChange = e => {
    const value = e.target.value;
    props.onChange({
      filterTerm: value,
      column: props.column,
      rawValue: value,
      attribute: props.column && props.column.name
    });
  };
  const key = "header-filter--" + props.column.key;
  return (
    <div key={key} className={Styles.outerDiv}>
      {renderInput()}
    </div>
  );
};

AttributeFilter.propTypes = {
  valid: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
  column: PropTypes.object,
  placeholderMsgId: PropTypes.string,
  tooltipMsgId: PropTypes.string,
  handleChange: PropTypes.func
};

AttributeFilter.defaultProps = {
  value: "",
  valid: true,
  onChange: () => {},
  column: {},
  placeholderMsgId: "atributeTable.filter.placeholders.default"
};

AttributeFilter.displayName = "AttributeFilter";

module.exports = withTranslation()(AttributeFilter);
