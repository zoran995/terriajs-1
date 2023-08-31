import { observer } from "mobx-react";
import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import CloseButton from "../Generic/CloseButton";
import { PrefaceBox } from "../Generic/PrefaceBox";
import { useViewState } from "../Context";
import ViewerMode from "./../../Models/ViewerMode";

const Box = require("../../Styled/Box").default;
const Text = require("../../Styled/Text").default;
const Spacing = require("../../Styled/Spacing").default;

const AboutPanelBox = styled(Box).attrs({
  position: "absolute",
  styledWidth: "700px",
  styledMaxHeight: "500px",
  backgroundColor: "white",
  rounded: true,
  paddedRatio: 4,
  overflowY: "auto",
  scroll: true
})`
  z-index: 1000;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 6px 6px 0 rgba(0, 0, 0, 0.12), 0 10px 20px 0 rgba(0, 0, 0, 0.05);
  @media (max-width: ${(props) => props.theme.mobile}px) {
    width: 100%;
    height: 100%;
  }
  @media (max-height: 500px) {
    height: 100%;
  }
`;

const AboutPanel: React.FC<{
  close: () => void;
}> = observer(({ close }) => {
  const theme = useTheme();
  const viewState = useViewState();
  const { t } = useTranslation();
  return (
    <AboutPanelBox column>
      <CloseButton color={theme.darkWithOverlay} topRight onClick={close} />
      <Text extraExtraLarge bold textDarker>
        {t("aboutPanel.title")}
      </Text>
      <Spacing bottom={5} />
      <StyledText>
        {parseCustomMarkdownToReact(t("aboutPanel.about"))}
      </StyledText>
      <Spacing bottom={2} />
      <Text large bold>
        {t("aboutPanel.technology")}
      </Text>
      <Spacing bottom={1} />
      <StyledText>
        {parseCustomMarkdownToReact(t("aboutPanel.technologyText"))}
      </StyledText>
      <Spacing bottom={2} />
      <Text>
        <Box
          justifySpaceBetween
          column={viewState.useSmallScreenInterface}
          centered={viewState.useSmallScreenInterface}
        >
          {viewState.terria.mainViewer.viewerMode === ViewerMode.Leaflet ? (
            <a
              id="leaflet"
              href="https://leafletjs.com/blog.html"
              target="_blank"
              rel="noreferrer"
            >
              <img src="images/leaflet.svg" height="48px" />
            </a>
          ) : (
            <a
              id="cesium"
              href="https://cesium.com/"
              target="_blank"
              rel="noreferrer"
            >
              <img src="images/cesium.svg" height="48px" />
            </a>
          )}
          <a
            id="geoserver"
            href="http://geoserver.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="images/geoserver.png" height="48px" />
          </a>
          <a
            id="geowebcache"
            href="https://www.geowebcache.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="images/geowebcache.png" height="48px" />
          </a>
        </Box>
        <Spacing bottom={1} />
        <Box
          justifySpaceBetween
          column={viewState.useSmallScreenInterface}
          centered={viewState.useSmallScreenInterface}
        >
          <a
            id="geonetwork"
            href="http://geonetwork-opensource.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="images/geonetwork3.png" height="48px" />
          </a>
          <a
            id="postgis"
            href="http://postgis.net/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="images/postgis.png" height="90px" />
          </a>
          <a
            id="postgresql"
            href="http://www.postgresql.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="images/postgresql.png" height="48px" />
          </a>
        </Box>
      </Text>
    </AboutPanelBox>
  );
});

const About: React.FC<{
  close: () => void;
}> = observer(({ close }) => {
  return createPortal(
    <>
      <PrefaceBox
        onClick={close}
        role="presentation"
        aria-hidden="true"
        pseudoBg
      ></PrefaceBox>
      <AboutPanel close={close}></AboutPanel>
    </>,
    document.getElementById("about-us-panel") || document.body
  );
});

const StyledText = styled(Text)`
  p {
    margin: 0;
  }
`;

export default About;
