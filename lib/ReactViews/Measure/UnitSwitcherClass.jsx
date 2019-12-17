import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./unitSwitcher.scss";

const UnitSwitcher = createReactClass({
  displayName: "UnitSwitcher",
  mixins: [ObserveModelMixin],
  propTypes: {
    units: PropTypes.array.isRequired,
    currentUnitId: PropTypes.number.isRequired,
    toggleItem: PropTypes.func
  },

  getInitialState() {
    return {
      listOpen: false
    };
  },

  handleClickOutside() {
    this.setState({
      listOpen: false
    });
  },

  toggleList() {
    this.setState(prevState => ({
      listOpen: !prevState.listOpen
    }));
  },

  render() {
    const list = this.props.units;
    const listOpen = this.state.listOpen;
    const placeHolderValue = this.props.units[this.props.currentUnitId].title;
    return (
      <div className={Styles.dropdownWrapper} onClick={() => this.toggleList()}>
        <div className={Styles.dropdownHeader}>
          {placeHolderValue}
          <span className={Styles.dropdownArrow} />
        </div>

        {listOpen && (
          <ul className={Styles.dropdownMenu}>
            {list.map(item => (
              <li
                className={classNames(Styles.dropdownOption, {
                  [Styles.isSelected]: item.id === this.props.currentUnitId
                })}
                key={item.id}
                onClick={() => this.props.toggleItem(item.id)}
              >
                {item.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
});

module.exports = UnitSwitcher;
