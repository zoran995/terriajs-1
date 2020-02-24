import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import AttributeFilter from "./AttributeFilter";

const REGEX = /\s*(!==|!=|<>|<=|>=|===|==|=|<|>)?\s*(-?\d*\.?\d*)\s*/;

const RuleType = {
  Number: 1,
  Range: 2,
  GreaterThen: 3,
  GreaterOrEqualThen: 4,
  LessThen: 5,
  LessOrEqualThen: 6,
  NotEqual: 7
};

const NumericFilter = props => {
  const filterValues = (row, columnFilter, columnKey) => {
    if (columnFilter.filterTerm === null) {
      return true;
    }
    let result = false;
    // implement default filter logic
    const value = parseInt(row[columnKey], 10);
    for (const ruleKey in columnFilter.filterTerm) {
      if (!columnFilter.filterTerm.hasOwnProperty(ruleKey)) {
        continue;
      }

      const rule = columnFilter.filterTerm[ruleKey];
      if (defined(rule.value) && isNaN(rule.value)) {
        const regex = /\s*(!==|!=|<>|<=|>=|===|==|=|<|>)?\s*/;
        const matches = regex.exec(rule.value);
        if (defined(matches[0])) {
          return true;
        } else {
          return false;
        }
      } else if (
        defined(rule.begin) &&
        defined(rule.end) &&
        isNaN(rule.begin) &&
        isNaN(rule.end)
      ) {
        return true;
      }
      switch (rule.type) {
        case RuleType.Number:
          if (rule.value === value) {
            result = true;
          }
          break;
        case RuleType.GreaterOrEqualThen:
          if (rule.value <= value) {
            result = true;
          }
          break;
        case RuleType.GreaterThen:
          if (rule.value < value) {
            result = true;
          }
          break;
        case RuleType.LessOrEqualThen:
          if (rule.value >= value) {
            result = true;
          }
          break;
        case RuleType.LessThen:
          if (rule.value > value) {
            result = true;
          }
          break;
        case RuleType.NotEqual:
          if (rule.value !== value) {
            result = true;
          }
          break;
        case RuleType.Range:
          if (rule.begin <= value && rule.end >= value) {
            result = true;
          }
          break;
        default:
          // do nothing
          break;
      }
    }
    return result;
  };

  const getRules = value => {
    const rules = [];
    if (value === "") {
      return rules;
    }
    // check comma
    const list = value.split(",");
    if (list.length > 0) {
      // handle each value with comma
      for (const key in list) {
        if (!list.hasOwnProperty(key)) {
          continue;
        }

        const obj = list[key];
        if (obj.indexOf("<>") > -1) {
          // handle not equal
          const value = parseInt(obj.split("<>")[1], 10);
          rules.push({ type: RuleType.NotEqual, value: value });
        } else if (obj.indexOf(">=") > -1) {
          // handle greater or equal then
          const begin = parseInt(obj.split(">=")[1], 10);
          rules.push({ type: RuleType.GreaterOrEqualThen, value: begin });
        } else if (obj.indexOf(">") > -1) {
          // handle greater then
          const begin = parseInt(obj.split(">")[1], 10);
          rules.push({ type: RuleType.GreaterThen, value: begin });
        } else if (obj.indexOf("<=") > -1) {
          // handle less or equal then
          const end = parseInt(obj.split("<=")[1], 10);
          rules.push({ type: RuleType.LessOrEqualThen, value: end });
        } else if (obj.indexOf("<") > -1) {
          // handle less then
          const end = parseInt(obj.split("<")[1], 10);
          rules.push({ type: RuleType.LessThen, value: end });
        } else if (obj.indexOf("!=") > -1) {
          // handle not equal
          const value = parseInt(obj.split("!=")[1], 10);
          rules.push({ type: RuleType.NotEqual, value: value });
        } else if (obj.indexOf(">=") > -1) {
          // handle greater or equal then
          const begin = parseInt(obj.split(">=")[1], 10);
          rules.push({ type: RuleType.GreaterOrEqualThen, value: begin });
        } else if (obj.indexOf("-") > 0) {
          // handle dash
          const begin = parseInt(obj.split("-")[0], 10);
          const end = parseInt(obj.split("-")[1], 10);
          rules.push({ type: RuleType.Range, begin: begin, end: end });
        } else {
          // handle normal values
          const numericValue = parseInt(obj, 10);
          rules.push({ type: RuleType.Number, value: numericValue });
        }
      }
    }
    return rules;
  };

  const handleChange = e => {
    const value = e.target.value;
    const filters = getRules(value);
    props.onChange({
      filterTerm: filters.length > 0 ? filters : null,
      column: props.column,
      rawValue: value,
      filterValues: filterValues
    });
  };

  return <AttributeFilter {...props} handleChange={handleChange} />;
};

NumericFilter.propTypes = {
  valid: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
  column: PropTypes.object,
  placeholderMsgId: PropTypes.string,
  tooltipMsgId: PropTypes.string,
  handleChange: PropTypes.func
};

module.exports = NumericFilter;
