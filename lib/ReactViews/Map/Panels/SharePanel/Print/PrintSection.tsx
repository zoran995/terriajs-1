import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";

import styled from "styled-components";

import ViewState from "../../../../../ReactViewModels/ViewState";

import Box from "../../../../../Styled/Box";
import { TextSpan } from "../../../../../Styled/Text";
import Button from "../../../../../Styled/Button";
import { downloadImg } from "./PrintView";

interface IPrintSectionProps {
  viewState: ViewState;
}

export const PrintSection: FC<IPrintSectionProps> = ({ viewState }) => {
  const { t } = useTranslation();

  const [isDownloading, setIsDownloading] = useState(false);

  const printView = () => {
    const newWindow = window.open();
    viewState.setPrintWindow(newWindow);
  };

  const downloadMap = () => {
    setIsDownloading(true);
    viewState.terria.currentViewer
      .captureScreenshot()
      .then((dataString) => {
        downloadImg(dataString);
      })
      .finally(() => setIsDownloading(false));
  };

  const leafletPrint = () => {
    viewState.openTool({
      toolName: t("printTool.title"),
      getToolComponent: () =>
        import("../../../../Tools/PrintTool/PrintToolPanel").then(
          (m) => m.default
        ),
      showCloseButton: false
    });
  };

  return (
    <Box column>
      <TextSpan medium>{t("share.printTitle")}</TextSpan>
      <Explanation>{t("share.printExplanation")}</Explanation>
      <Box gap>
        <PrintButton
          primary
          fullWidth
          disabled={isDownloading}
          onClick={downloadMap}
        >
          <TextSpan medium>{t("share.downloadMap")}</TextSpan>
        </PrintButton>
        {viewState.terria.currentViewer.type === "Leaflet" && (
          <PrintButton primary fullWidth onClick={leafletPrint}>
            <TextSpan medium>{t("share.printButton")}</TextSpan>
          </PrintButton>
        )}
        {viewState.terria.currentViewer.type === "Cesium" && (
          <PrintButton primary fullWidth onClick={printView}>
            <TextSpan medium>{t("share.printViewButton")}</TextSpan>
          </PrintButton>
        )}
      </Box>
    </Box>
  );
};

const PrintButton = styled(Button)`
  border-radius: 4px;
`;

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
