"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import DragWrapper from "../DragWrapper.jsx";
import Icon from "../Icon.jsx";
import ObserveModelMixin from "../ObserveModelMixin";
import Styles from "./attribute-table-panel.scss";
import AttributeTable from "./AttributeTable.jsx";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";

export const AttributeTablePanel = createReactClass({
  displayName: "AttributeTablePanel",
  mixins: [ObserveModelMixin],

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    printView: PropTypes.bool,
    t: PropTypes.func.isRequired
  },

  ref: null,

  getInitialState() {
    return {
      left: null,
      right: null,
      top: null,
      bottom: null,
      oldSelectedFeature: undefined
    };
  },

  componentDidMount() {
    this.attributeTableCatalogItemChangeSubscription = knockout
      .getObservable(this.props.terria, "attributeTableCatalogItem")
      .subscribe(function() {
        const terria = this.props.terria;
        if (
          defined(terria.selectedFeature) &&
          (defined(terria.selectedFeature.properties) ||
            defined(terria.selectedFeature.description))
        ) {
          this.setState({ oldSelectedFeatureId: terria.selectedFeature.id });
          // terria.pickedFeatures = undefined;
          // terria.selectedFeature = undefined;
          this.props.viewState.featureInfoPanelIsVisible = false;
        }
      }, this);
  },

  componentWillUnmount() {
    if (this.attributeTableCatalogItemChangeSubscription) {
      this.attributeTableCatalogItemChangeSubscription.dispose();
      this.attributeTableCatalogItemChangeSubscription = undefined;
    }
  },

  close() {
    this.props.viewState.attributeTablePanelIsVisible = false;

    // give the close animation time to finish before unselecting, to avoid jumpiness
    setTimeout(() => {
      if (
        this.props.terria.pickedFeatures === undefined &&
        this.props.terria.selectedFeature !== undefined
      ) {
        this.props.terria.selectedFeature = undefined;
      }
      this.props.terria.pickedFeatures === undefined;
      this.props.terria.selectedFeature = undefined;
      this.props.terria.attributeTableCatalogItem = undefined;
      this.props.viewState.featureInfoPanelIsVisible = false;
    }, 200);
  },

  toggleCollapsed(event) {
    this.props.viewState.attributeTablePanelIsCollapsed = !this.props.viewState
      .attributeTablePanelIsCollapsed;
  },

  renderAttributeTable(catalogItem) {
    return (
      <AttributeTable
        key={`attributeTable-${catalogItem.name}`}
        terria={this.props.terria}
        viewState={this.props.viewState}
        catalogItem={catalogItem}
        attributeTable={catalogItem.attributeTable}
        selectedFeatureId={this.state.oldSelectedFeatureId}
      />
    );
  },

  render() {
    const { t } = this.props;
    const terria = this.props.terria;
    const viewState = this.props.viewState;
    const panelClassName = classNames(Styles.panel, {
      [Styles.isCollapsed]: viewState.attributeTablePanelIsCollapsed,
      [Styles.isVisible]: viewState.attributeTablePanelIsVisible,
      [Styles.isTranslucent]: viewState.explorerPanelIsVisible
    });

    this.ref = React.createRef();
    return (
      <DragWrapper ref={this.ref}>
        <div
          className={panelClassName}
          aria-hidden={!viewState.attributeTablePanelIsVisible}
        >
          {defined(terria.attributeTableCatalogItem) && (
            <div>
              <div className={Styles.header}>
                <div
                  className={classNames("drag-handle", Styles.btnPanelHeading)}
                >
                  <span>
                    {t("attributeTable.panelHeading") +
                      " - " +
                      terria.attributeTableCatalogItem.nameInCatalog}
                  </span>
                  {/* <button
                    type="button"
                    onClick={this.toggleCollapsed}
                    className={Styles.btnToggleAttributeTable}
                  >
                    {this.props.viewState.attributeTablePanelIsCollapsed ? (
                      <Icon glyph={Icon.GLYPHS.closed} />
                    ) : (
                      <Icon glyph={Icon.GLYPHS.opened} />
                    )}
                  </button> */}
                </div>
                <button
                  type="button"
                  onClick={this.close}
                  className={Styles.btnCloseAttributeTable}
                  title={t("attributeTable.btnCloseAttributeTable")}
                >
                  <Icon glyph={Icon.GLYPHS.close} />
                </button>
              </div>

              <Choose>
                <When
                  condition={
                    viewState.attributeTablePanelIsCollapsed ||
                    !viewState.attributeTablePanelIsVisible
                  }
                />
                <Otherwise>
                  {this.renderAttributeTable(terria.attributeTableCatalogItem)}
                </Otherwise>
              </Choose>
            </div>
          )}
        </div>
      </DragWrapper>
    );
  }
});

export default withTranslation()(AttributeTablePanel);
