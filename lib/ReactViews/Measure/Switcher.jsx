import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
// import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./Switcher.scss";
import useComponentVisible from "./useComponentVisible";
import defined from "terriajs-cesium/Source/Core/defined";

Switcher.propTypes = {
  units: PropTypes.array,
  currentUnitId: PropTypes.number,
  toggleItem: PropTypes.func
};
Switcher.displayName = "Switcher";

function Switcher(props) {
  // const [isOpen, setIsOpen] = useState(false);
  const { ref, isOpen, setIsOpen } = useComponentVisible(false);
  const list = props.units;
  const placeHolderValue = defined(props.currentUnitId)
    ? props.units[props.currentUnitId].title
    : "";
  const handleChange = defined(props.toggleItem)
    ? function(item) {
        props.toggleItem(item.id);
        setIsOpen(false);
      }
    : undefined;

  return (
    <div className={Styles.dropdownWrapper} ref={ref}>
      {defined(props.currentUnitId) && (
        <div
          className={Styles.dropdownHeader}
          onClick={() => setIsOpen(!isOpen)}
        >
          {placeHolderValue}
          <span className={Styles.dropdownArrow} />
        </div>
      )}

      {isOpen && defined(props.currentUnitId) && (
        <ul className={Styles.dropdownMenu}>
          {list.map(item => (
            <li
              className={classNames(Styles.dropdownOption, {
                [Styles.isSelected]: item.id === props.currentUnitId
              })}
              key={item.id}
              onClick={() => handleChange(item)}
            >
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

module.exports = Switcher;
