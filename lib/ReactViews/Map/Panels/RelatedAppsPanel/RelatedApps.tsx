import { TFunction } from "i18next";
import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import MenuPanel from "./../../../StandardUserInterface/customizable/MenuPanel";
import Styles from "./related-apps.scss";
import RelatedAppsItem from "./RelatedAppsItem";

interface PropsType extends WithTranslation {
  t: TFunction;
  viewState: ViewState;
}

class RelatedApps extends React.Component<PropsType> {
  static displayName: "RelatedApps";

  private terria: Terria;

  constructor(props: PropsType) {
    super(props);

    this.terria = props.viewState.terria;
  }

  render() {
    const { t, viewState } = this.props;

    const relatedApps = this.terria.configParameters.relatedAppsContent;

    const dropdownTheme = {
      inner: Styles.dropdownInner,
      icon: "gallery"
    };

    return (
      //@ts-ignore
      <MenuPanel
        theme={dropdownTheme}
        btnTitle={t("relatedApps.btnTitle")}
        btnText={t("relatedApps.btnText")}
        viewState={this.props.viewState}
        smallScreen={this.props.viewState.useSmallScreenInterface}
        showDropdownInCenter
        modalWidth={380}
      >
        <Box fullWidth paddedRatio={2} column>
          <Text extraExtraLarge textLight bold>
            {t("relatedApps.title")}
          </Text>
          <Spacing bottom={2} />
          {/* <Text textLightDimmed medium>
            {t("relatedApps.description")}
          </Text> */}
          <Spacing bottom={2} />
          {relatedApps &&
            relatedApps.map((item: any, index: number) => (
              <RelatedAppsItem
                key={`related-app-${index}`}
                viewState={viewState}
                content={item}
                lastItem={index === relatedApps.length - 1}
              />
            ))}
        </Box>
      </MenuPanel>
    );
  }
}

export default withTranslation()(RelatedApps);
