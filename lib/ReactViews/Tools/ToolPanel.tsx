import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";

import ViewState from "../../ReactViewModels/ViewState";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Select from "../../Styled/Select";
import { parseCustomMarkdownToReactWithOptions } from "../Custom/parseCustomMarkdownToReact";

interface ToolPanelProps {
  viewState: ViewState;
  toolTitle: string;
  exitTitle: string;
  glyph: any;
  exitAction?(): void;
}

interface ToolPanelToggleProps {
  collapsed?: boolean;
}

const ToolPanelToggle = styled(Box)<ToolPanelToggleProps>`
  ${({ theme }) => theme.borderRadiusTop(theme.radius40Button)}
  ${(props) =>
    props.collapsed && props.theme.borderRadius(props.theme.radius40Button)}
`;

const ToolPanel: React.FC<ToolPanelProps> = (props) => {
  const [showChildren, setShowChildren] = useState(true);
  const { t } = useTranslation();
  const { viewState } = props;
  const theme = useTheme();
  const exit = () => {
    viewState.closeTool();
    if (props.exitAction) {
      props.exitAction();
    }
  };
  return (
    <ToolPanelWrapper isMapFullScreen={viewState.isMapFullScreen} column>
      <ToolPanelToggle
        paddedVertically
        paddedHorizontally={2}
        centered
        justifySpaceBetween
        backgroundColor={theme.colorSecondary}
        collapsed={!showChildren}
      >
        <Box centered>
          <StyledIcon styledWidth="20px" light glyph={props.glyph} />
          <Spacing right={1} />
          <Text
            textLight
            semiBold
            // font-size is non standard with what we have so far in terria,
            // lineheight as well to hit nonstandard paddings
            styledFontSize="17px"
            styledLineHeight="30px"
          >
            {props.toolTitle}
          </Text>
        </Box>
        {/* margin-right 5px for the padded button offset - larger click area
        but visible should be inline with rest of box */}
        <Box centered css={"margin-right:-5px;"}>
          <RawButton onClick={() => exit()}>
            <Text textLight small semiBold uppercase>
              {props.exitTitle}
            </Text>
          </RawButton>
          <Spacing right={1} />
          <RawButton onClick={() => setShowChildren(!showChildren)}>
            <Box paddedRatio={1} centered>
              <StyledIcon
                styledWidth="12px"
                light
                glyph={showChildren ? GLYPHS.opened : GLYPHS.closed}
              />
            </Box>
          </RawButton>
        </Box>
      </ToolPanelToggle>
      {showChildren && props.children}
    </ToolPanelWrapper>
  );
};

interface ToolPanelWrapperProps {
  isMapFullScreen?: boolean;
}

const ToolPanelWrapper = styled(Box).attrs({
  column: true,
  position: "absolute",
  styledWidth: "274px"
  // charcoalGreyBg: true
})<ToolPanelWrapperProps>`
  top: 70px;
  left: 0px;
  margin-left: ${(props) =>
    props.isMapFullScreen ? 16 : parseInt(props.theme.workbenchWidth) + 40}px;
  transition: margin-left 0.25s;
`;

export const ResultWrapper = styled(Box).attrs({
  styledWidth: "330px"
})<ToolPanelWrapperProps>`
  position: fixed;
  transform: translateX(-50%);
  margin-left: ${(props) =>
    props.isMapFullScreen
      ? 0
      : parseInt(props.theme.workbenchWidth) -
        parseInt(props.styledWidth) / 2}px;
  left: 50%;
  z-index: 999;
  top: initial;
  bottom: 60px;
  box-sizing: border-box;
  padding: 10px 15px;
  background: ${(props) => props.theme.colorSecondary};
  color: ${(props) => props.theme.textLight};
`;

export const MainPanel = styled(Box).attrs({
  column: true,
  overflowY: "auto",
  paddedRatio: 2
})<ToolPanelWrapperProps>`
  ${({ theme }) => theme.borderRadiusBottom(theme.radius40Button)}
  background-color: ${(p) => p.theme.darkWithOverlay};
`;

export const Selector = (props: any) => (
  <Box fullWidth column>
    <label>
      {/* <Text textLight>{props.label}:</Text> */}
      <Text textLight css={"p {margin: 0;}"}>
        {parseCustomMarkdownToReactWithOptions(`${props.label}:`, {
          injectTermsAsTooltips: true,
          tooltipTerms: props.viewState.terria.configParameters.helpContentTerms
        })}
      </Text>
      <Spacing bottom={1} />
      <Select {...props}>{props.children}</Select>
      {props.spacingBottom && <Spacing bottom={2} />}
    </label>
  </Box>
);

export default ToolPanel;
