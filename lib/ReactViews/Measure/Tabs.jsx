import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import AreaPanel from "./MeasurePanels/AreaPanel";
import DistancePanel from "./MeasurePanels/DistancePanel";
import EmptyPanel from "./MeasurePanels/EmptyPanel";
import Styles from "./MeasureTabs.scss";
import CoordinatePanel from "./MeasurePanels/CoordinatePanel";

const Tabs = createReactClass({
  displayName: "Tabs",
  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    currentTabId: PropTypes.number,
    activateTab: PropTypes.func.isRequired
  },
  getInitialState() {
    return {
      totalDistanceMetres: 0
    };
  },

  getTabs() {
    const DistanceTab = {
      title: "distance",
      name: "distance",
      panel: (
        <DistancePanel
          terria={this.props.terria}
          viewState={this.props.viewState}
        />
      )
    };

    const AreaTab = {
      title: "area",
      name: "area",
      panel: (
        <AreaPanel
          terria={this.props.terria}
          viewState={this.props.viewState}
        />
      )
    };
    const CoordinateTab = {
      title: "coordinate",
      name: "coordinate",
      panel: (
        <CoordinatePanel
          terria={this.props.terria}
          viewState={this.props.viewState}
        />
      )
    };
    return [DistanceTab, AreaTab, CoordinateTab];
  },

  render() {
    const tabs = this.getTabs();

    const currentTab = defined(this.props.currentTabId)
      ? tabs[this.props.currentTabId]
      : undefined;
    return (
      <div className={Styles.tabs}>
        <ul className={Styles.tabList} role="tablist">
          <For each="item" index="i" of={tabs}>
            <li
              key={i}
              id={"tablist--" + item.title}
              className={Styles.tabListItem}
              role="tab"
              aria-controls={"panel--" + item.title}
              aria-selected={item === currentTab}
            >
              <button
                type="button"
                onClick={() => this.props.activateTab(i)}
                className={classNames(Styles.btnTab, {
                  [Styles.btnSelected]: item === currentTab
                })}
              >
                {item.name}
              </button>
            </li>
          </For>
        </ul>
        {defined(currentTab) ? (
          <section
            key={currentTab.title}
            id={"panel--" + currentTab.title}
            className={classNames(Styles.tabPanels, Styles.isActive)}
            aria-labelledby={"tablist--" + currentTab.title}
            role="tabpanel"
            tabIndex="0"
          >
            <div>{currentTab.panel}</div>
          </section>
        ) : (
          <EmptyPanel />
        )}
      </div>
    );
  }
});

module.exports = Tabs;
