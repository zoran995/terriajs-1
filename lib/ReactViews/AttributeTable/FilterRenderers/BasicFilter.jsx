import AttributeFilter from "./AttributeFilter";
import { useCallback } from "react";

const BasicFilter = props => {
  const onChange = ({ value, attribute } = {}) => {
    props.onValueChange(value);
    props.onChange({
      value: value,
      operator: "=",
      type: props.type,
      attribute
    });
  };
};
