import { observer } from "mobx-react";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";

import PropTypes from "prop-types";

import classNames from "classnames";
import { runInAction } from "mobx";
import { withTranslation } from "react-i18next";
import { Category, HelpAction } from "../../Core/AnalyticEvents/analyticEvents";
import { applyTranslationIfExists } from "../../Language/languageHelpers";
// import HelpMenuPanelBasic from "../HelpScreens/HelpMenuPanelBasic";
import SettingPanel from "../Map/Panels/SettingPanel";
import SharePanel from "../Map/Panels/SharePanel/SharePanel";
import Styles from "./mobile-menu.scss";
import MobileMenuItem from "./MobileMenuItem";

@observer
class MobileMenu extends React.Component {
  static propTypes = {
    menuItems: PropTypes.arrayOf(PropTypes.element),
    menuLeftItems: PropTypes.arrayOf(PropTypes.element),
    viewState: PropTypes.object.isRequired,
    showFeedback: PropTypes.bool,
    terria: PropTypes.object.isRequired,
    i18n: PropTypes.object,
    allBaseMaps: PropTypes.array.isRequired,
    t: PropTypes.func.isRequired
  };

  static defaultProps = {
    menuItems: [],
    showFeedback: false
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  toggleMenu() {
    runInAction(() => {
      this.props.viewState.mobileMenuVisible =
        !this.props.viewState.mobileMenuVisible;
    });
  }

  onFeedbackFormClick() {
    runInAction(() => {
      this.props.viewState.feedbackFormIsVisible = true;
      this.props.viewState.mobileMenuVisible = false;
    });
  }

  hideMenu() {
    runInAction(() => {
      this.props.viewState.mobileMenuVisible = false;
    });
  }

  runStories() {
    this.props.viewState.runStories();
  }

  dismissSatelliteGuidanceAction() {
    this.props.viewState.toggleFeaturePrompt("mapGuidesLocation", true, true);
  }

  /**
   * If the help configuration defines an item named `mapuserguide`, this
   * method returns props for showing it in the mobile menu.
   */
  mapUserGuide() {
    const helpItems = this.props.terria.configParameters.helpContent;
    const mapUserGuideItem = helpItems?.find(
      ({ itemName }) => itemName === "mapuserguide"
    );
    if (!mapUserGuideItem) {
      return undefined;
    }
    const title = applyTranslationIfExists(
      mapUserGuideItem.title,
      this.props.i18n
    );
    return {
      href: mapUserGuideItem.url,
      caption: title,
      onClick: () => {
        this.props.terria.analytics?.logEvent(
          Category.help,
          HelpAction.itemSelected,
          title
        );
      }
    };
  }

  render() {
    const { t } = this.props;
    const hasStories =
      this.props.terria.configParameters.storyEnabled &&
      defined(this.props.terria.stories) &&
      this.props.terria.stories.length > 0;

    const showLanguageSwitcher =
      defined(this.props.terria.configParameters.languageConfiguration) &&
      this.props.terria.configParameters.languageConfiguration.enabled &&
      defined(
        this.props.terria.configParameters.languageConfiguration.languages
      ) &&
      Object.keys(
        this.props.terria.configParameters.languageConfiguration.languages
      ).length > 1;

    const mapUserGuide = this.mapUserGuide();

    // return this.props.viewState.mobileMenuVisible ? (
    return (
      <div>
        <If condition={this.props.viewState.mobileMenuVisible}>
          <div className={Styles.overlay} onClick={this.toggleMenu} />
        </If>
        <div
          className={classNames(Styles.mobileNav, {
            [Styles.mobileNavHidden]: !this.props.viewState.mobileMenuVisible
          })}
        >
          <For each="menuItem" of={this.props.menuLeftItems}>
            <div
              onClick={this.hideMenu}
              key={menuItem ? menuItem.key : undefined}
            >
              {menuItem}
            </div>
          </For>
          <div onClick={this.hideMenu}>
            <SettingPanel
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </div>
          <div onClick={this.hideMenu}>
            <SharePanel
              terria={this.props.terria}
              viewState={this.props.viewState}
            />
          </div>
          <For each="menuItem" of={this.props.menuItems}>
            <div
              onClick={this.hideMenu}
              key={menuItem ? menuItem.key : undefined}
            >
              {menuItem}
            </div>
          </For>
          {mapUserGuide && <MobileMenuItem {...mapUserGuide} />}
          <If condition={this.props.showFeedback}>
            <MobileMenuItem
              onClick={this.onFeedbackFormClick}
              caption={t("feedback.feedbackBtnText")}
            />
          </If>
          <If condition={hasStories}>
            <MobileMenuItem
              onClick={this.runStories}
              caption={t("story.mobileViewStory", {
                storiesLength: this.props.terria.stories.length
              })}
            />
          </If>
          <If condition={showLanguageSwitcher}>
            <MobileMenuItem
              caption={
                <LanguageSwitcherSelect
                  viewState={this.props.viewState}
                  hideIcon
                  aditionalAction={this.hideMenu}
                  selectProps={{
                    css: `
                      border-radius: 0;
                      margin: -15px 0;
                      padding: 15px 0;
                      color: inherit;
                    `
                  }}
                />
              }
            />
          </If>
        </div>
      </div>
    );
  }
}

export default withTranslation()(MobileMenu);
