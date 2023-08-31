import React, { FC, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import AboutPanel from "../../../About/AboutPanel";

export const AboutPanelButton: FC = () => {
  const [aboutPanelVisible, setaboutPanelVisible] = useState(false);

  const { t } = useTranslation();

  const showAboutPanel = useCallback(() => {
    setaboutPanelVisible(true);
  }, [setaboutPanelVisible]);

  const hideAboutPanel = useCallback(() => {
    setaboutPanelVisible(false);
  }, [setaboutPanelVisible]);

  return (
    <>
      <a onClick={showAboutPanel}>{t("map.extraCreditLinks.about")}</a>
      {aboutPanelVisible ? <AboutPanel close={hideAboutPanel} /> : null}
    </>
  );
};
